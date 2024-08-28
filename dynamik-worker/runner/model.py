from __future__ import annotations
import json
import os
import typing
from dataclasses import dataclass
from datetime import timedelta, datetime
from typing import List
from pytimeparse import parse

from dynamik.input import EventMapping


@dataclass
class AlgorithmConfiguration:
    window_size: timedelta
    drift_magnitude: timedelta
    warnings: int

    def asdict(self):
        return {
            "window_size": self.window_size.days,
            "drift_magnitude": self.drift_magnitude,
            "warnings": self.warnings,
        }


@dataclass
class Experiment:
    logs: List[str]
    id: str
    email: str
    submitted: datetime
    config: AlgorithmConfiguration
    mapping: EventMapping

    @staticmethod
    def from_json(content):
        data = json.loads(content)
        basepath = os.path.abspath(os.path.join(os.environ.get('BASE_DATA_PATH', os.path.join('..', '..', 'dynamik-data')), 'logs'))

        return Experiment(
            logs=[str(os.path.join(basepath, log)) for log in data['logs']],
            id=data['id'],
            submitted=datetime.fromisoformat(data['submitted']),
            email=data['email'],
            config=AlgorithmConfiguration(
                window_size=timedelta(seconds=parse(data['config']['window_size'])),
                drift_magnitude=timedelta(seconds=parse(data['config']['drift_magnitude'])),
                warnings=int(data['config']['warnings'])
            ),
            mapping=EventMapping(
                start=data['mapping']['start'],
                end=data['mapping']['end'],
                case=data['mapping']['case'],
                activity=data['mapping']['activity'],
                resource=data['mapping']['resource'],
                enablement=data['mapping']['enablement'],
                attributes=data['mapping']['attributes']
            )
        )

    def asdict(self: typing.Self) -> dict:
        return {
            'logs': self.logs,
            'id': self.id,
            'email': self.email,
            'submitted': self.submitted,
            'started': self.started,
            'config': self.config.asdict(),
            'mapping': {
                'case': self.mapping.case,
                'activity': self.mapping.activity,
                'resource': self.mapping.resource,
                'start': self.mapping.start,
                'end': self.mapping.end,
                'enablement': self.mapping.enablement,
                'attributes': self.mapping.attributes
            }
        }


@dataclass
class Status:
    status: str
    error: str | None
    progress: int
    currentRef: (datetime, datetime)
    currentRun: (datetime, datetime)

    def asdict(self: typing.Self) -> dict:
        return {
            'status': self.status,
            'error': self.error,
            'progress': self.progress,
            'currentRef': self.currentRef,
            'currentRun': self.currentRun,
        }


@dataclass
class DriftOverview:
    index: int
    experiment: str
    description: str
    referenceWindow: (datetime, datetime)
    runningWindow: (datetime, datetime)

    def asdict(self: typing.Self) -> dict:
        return {
            'index': self.index,
            'experiment': self.experiment,
            'description': self.description,
            'referenceWindow': self.referenceWindow,
            'runningWindow': self.runningWindow
        }


@dataclass
class DriftDetails(DriftOverview):
    causes: list[DriftCause]

    def asdict(self: typing.Self) -> dict:
        return {
            'index': self.index,
            'experiment': self.experiment,
            'description': self.description,
            'referenceWindow': self.referenceWindow,
            'runningWindow': self.runningWindow,
            'causes': [cause.asdict() for cause in self.causes]
        }


@dataclass
class DriftCause:
    cause: str
    reference: list
    running: list

    def asdict(self: typing.Self) -> dict:
        return {
            'cause': self.cause,
            'reference': self.reference,
            'running': self.running
        }


@dataclass
class ExecutionStatus:
    status: Status
    startDate: datetime
    lastUpdateDate: datetime
    drifts: List[DriftOverview]

    def asdict(self: typing.Self) -> dict:
        return {
            "status": self.status.asdict(),
            "startDate": self.startDate,
            "lastUpdateDate": self.lastUpdateDate,
            "drifts": [drift.asdict() for drift in self.drifts],
        }
