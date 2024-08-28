import json
import os
import textwrap
import traceback
from datetime import timedelta, datetime, timezone
from platform import node

import pika
import humanreadable as hr
from anytree import PreOrderIter

from dynamik.utils.logger import setup_logger, LOGGER
from dynamik.drift import detect_drift, explain_drift
from dynamik.drift.model import DriftLevel, DriftCause as CausesTree
from dynamik.input.csv import read_and_merge_csv_logs
from dynamik.utils.pm.concurrency import OverlappingConcurrencyOracle

from runner.file_manager import write_to_file
from runner.json_encoder import JSONEncoder
from runner.model import Experiment, DriftOverview, ExecutionStatus, Status, DriftDetails, DriftCause


def build_change_description(causes: CausesTree) -> str:
    ct = causes
    wt = [cause for cause in causes.children if "cycle-time/waiting-time" == cause.what]
    pt = [cause for cause in causes.children if "cycle-time/processing-time" == cause.what]

    base = textwrap.dedent(f"""\
        Found a drift in the activity instances cycle time. 
        Average time went from {
            hr.Time(str(round(ct.how.reference.mean)), default_unit=hr.Time.Unit.SECOND).to_humanreadable("full")
        } to {
            hr.Time(str(round(ct.how.running.mean)), default_unit=hr.Time.Unit.SECOND).to_humanreadable("full")
        }.
        """)

    waiting = textwrap.dedent(f"""\
        Mean waiting time went from {
            hr.Time(str(round(wt[0].how.reference.mean)), default_unit=hr.Time.Unit.SECOND).to_humanreadable("full")
        } to {
            hr.Time(str(round(wt[0].how.running.mean)), default_unit=hr.Time.Unit.SECOND).to_humanreadable("full")
        }.""") if len(wt) > 0 else "No change in the waiting time was detected."

    processing = textwrap.dedent(f"""\
        Mean processing time went from {
            hr.Time(str(round(pt[0].how.reference.mean)), default_unit=hr.Time.Unit.SECOND).to_humanreadable("full")
        } to {
            hr.Time(str(round(pt[0].how.running.mean)), default_unit=hr.Time.Unit.SECOND).to_humanreadable("full")
        }.""") if len(pt) > 0 else "No change in the processing time was detected."

    return textwrap.dedent(f"""\
        {base}
        Specifically:
            {processing}
            {waiting}
    """)


def notify_and_write(channel, experiment: Experiment, status: ExecutionStatus):
    channel.basic_publish(
        exchange=os.environ.get('LIVE_STATUS_EXCHANGE', 'status@dynamik'),
        routing_key=experiment.id,
        body=json.dumps(status, cls=JSONEncoder),
        properties=pika.BasicProperties(
            content_type='application/json',
        ),
    )

    write_to_file('results', f'{experiment.id}.result.json', json.dumps(status, cls=JSONEncoder, indent=2))


def on_message(channel, _, __, body):
    experiment = Experiment.from_json(body)

    LOGGER.info('Received experiment %s', experiment.id)
    LOGGER.info('Starting execution...')

    execution_start = datetime.now(timezone.utc)

    try:
        compute_enablements = experiment.mapping.enablement == '__DISCOVER__'

        if compute_enablements:
            experiment.mapping.enablement = None

        log = list(
            read_and_merge_csv_logs(
                logs=experiment.logs,
                attribute_mapping=experiment.mapping,
                add_artificial_start_end_events=True,
                preprocessor=lambda _log: OverlappingConcurrencyOracle(_log).compute_enablement_timestamps() if compute_enablements else _log
            )
        )

        # compute auxiliary values for building the progress
        start_date = min(event.enabled for event in log)
        end_date = max(event.end for event in log)
        timespan = end_date-start_date
        already_processed: timedelta = 2 * experiment.config.window_size

        status = ExecutionStatus(
            status=Status(
                status='running',
                progress=int((already_processed / timespan) * 100),
                currentRef=(start_date, start_date + experiment.config.window_size),
                currentRun=(start_date + experiment.config.window_size, start_date + (2 * experiment.config.window_size)),
                error=None
            ),
            startDate=execution_start,
            lastUpdateDate=datetime.now(timezone.utc),
            drifts=[],
        )

        notify_and_write(channel, experiment, status)

        detector = detect_drift(
            log=log,
            timeframe_size=experiment.config.window_size,
            warm_up=timedelta(),
            warnings_to_confirm=experiment.config.warnings,
            threshold=experiment.config.drift_magnitude,
            significance=0.05,
        )

        drifts = []

        for drift in detector:
            if already_processed != drift.running_model.end - start_date or drift.level == DriftLevel.CONFIRMED:
                already_processed = drift.running_model.end - start_date

                if drift.level == DriftLevel.CONFIRMED:
                    causes = explain_drift(
                        drift=drift,
                        first_activity='__SYNTHETIC_START_EVENT__',
                        last_activity='__SYNTHETIC_END_EVENT__',
                        calendar_threshold=0.1,
                        threshold=experiment.config.drift_magnitude,
                    )

                    drift_overview = DriftOverview(
                        index=len(drifts),
                        experiment=experiment.id,
                        description=build_change_description(causes),
                        referenceWindow=(drift.reference_model.start, drift.reference_model.end),
                        runningWindow=(drift.running_model.start, drift.running_model.end),
                    )

                    drifts.append(drift_overview)

                    drift_details = DriftDetails(
                        index=drift_overview.index,
                        experiment=drift_overview.experiment,
                        description=drift_overview.description,
                        referenceWindow=drift_overview.referenceWindow,
                        runningWindow=drift_overview.runningWindow,
                        causes=[
                            DriftCause(
                                cause=cause.what,
                                reference=cause.data.reference,
                                running=cause.data.running
                            ) for cause in PreOrderIter(causes)
                        ]
                    )

                    write_to_file('results', f'{experiment.id}.result.{drift_overview.index}.json',  json.dumps(drift_details, cls=JSONEncoder, indent=2))

                status = ExecutionStatus(
                    status=Status(
                        status='running',
                        progress=int((already_processed/timespan)*100),
                        currentRef=(drift.reference_model.start, drift.reference_model.end),
                        currentRun=(drift.running_model.start, drift.running_model.end),
                        error=None
                    ),
                    startDate=execution_start,
                    lastUpdateDate=datetime.now(timezone.utc),
                    drifts=drifts,
                )

                notify_and_write(channel, experiment, status)

        # last update event
        status = ExecutionStatus(
            status=Status(
                status='finished',
                progress=100,
                currentRef=((end_date - 2 * experiment.config.window_size), (end_date - experiment.config.window_size)),
                currentRun=((end_date - experiment.config.window_size), end_date),
                error=None
            ),
            startDate=execution_start,
            lastUpdateDate=datetime.now(timezone.utc),
            drifts=drifts,
        )

        notify_and_write(channel, experiment, status)

        LOGGER.info('Experiment %s finished!', experiment.id)
    except Exception as e:
        LOGGER.error('Experiment %r execution failed!', experiment)
        traceback.print_exception(e)
        status = ExecutionStatus(
            status=Status(
                status='failed',
                error=repr(e),
                progress=-1,
                currentRef=(),
                currentRun=(),
            ),
            startDate=execution_start,
            lastUpdateDate=datetime.now(timezone.utc),
            drifts=[],
        )

    notify_and_write(channel, experiment, status)


def main():
    LOGGER.info('Launching dynamik worker...')

    with pika.BlockingConnection(
            pika.ConnectionParameters(
                host=os.environ.get('RABBITMQ_HOST', 'localhost'),
                port=os.environ.get('RABBITMQ_PORT', 5672),
                credentials=pika.credentials.PlainCredentials(
                    os.environ.get('RABBITMQ_USER', 'guest'),
                    os.environ.get('RABBITMQ_PASS', 'guest'),
                ),
                client_properties={
                    'connection_name': f'worker-{node()}@dynamik',
                },

            ),
    ) as connection:
        with connection.channel() as channel:
            # queue for getting experiments
            channel.queue_declare(queue=os.environ.get('EXPERIMENTS_QUEUE', 'experiments@dynamik'), durable=True)
            # exchange for publishing status updates
            channel.exchange_declare(
                exchange=os.environ.get('LIVE_STATUS_EXCHANGE', 'status@dynamik'),
                exchange_type='direct',
                durable=True,
            )

            channel.basic_consume(
                queue=os.environ.get('EXPERIMENTS_QUEUE', 'experiments@dynamik'),
                on_message_callback=on_message,
                auto_ack=True
            )

            channel.start_consuming()


if __name__ == '__main__':
    setup_logger(disable_third_party_warnings=True)
    main()
