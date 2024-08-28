import { useLoaderData, Link } from '@remix-run/react'

import { PrinterIcon, XMarkIcon } from '@heroicons/react/24/outline'

import type { DriftCause } from '~/types'

import {
    TimeDistributionPlot,
    CalendarPlot,
    RatePlot,
    PoliciesPlot,
    ActivityProfilePlots,
    ResourceProfilePlots
} from './components'
import loader from './loader'

export { loader }

function findCause(name: RegExp, causes: DriftCause[]): DriftCause[] {
    return causes.filter(cause => name.test(cause.cause))
}

export default function DriftDetails() {
    const {
        experiment,
        index,
        description,
        causes,
    } = useLoaderData<typeof loader>()

    return <>
        <nav className='flex w-full flex-row justify-between print:hidden'>
            <button onClick={() => window && window.print()}>
                <PrinterIcon className='size-6 stroke-1'/>
            </button>
            <Link to='./..' reloadDocument>
                <XMarkIcon className='size-6 stroke-1'/>
            </Link>
        </nav>
        <div
            className='flex max-h-[80vh] min-h-[60vh] w-full flex-col gap-4 overflow-y-auto rounded-2xl bg-white px-24 py-28 shadow shadow-slate-300 dark:bg-gray-900 dark:shadow-slate-950 print:max-h-none print:overflow-y-visible print:p-0 print:shadow-none'>
            <header className='relative mb-8'>
                <h1 className='mb-4 text-center text-3xl font-semibold'>Experiment {experiment}</h1>
                <h2 className='mb-4 text-center text-2xl font-semibold'>Drift {index + 1}</h2>
                <p className='text-justify font-medium text-slate-500'>{description}</p>
            </header>
            <div className = 'flex flex-col gap-8'>
                <TimeDistributionPlot title='Cycle times distribution' data = { findCause(/^(cycle-time)$/, causes as DriftCause[])[0] }/>

                <TimeDistributionPlot title='Processing times distribution' data = { findCause(/(processing-time)$/ , causes as DriftCause[])[0] }/>
                <TimeDistributionPlot title='Processing times with resourcess on-duty distribution' data = { findCause(/(processing-time\/available)$/, causes as DriftCause[])[0] }/>
                <TimeDistributionPlot title='Processing times distribution with resources off-duty' data = { findCause(/(processing-time\/unavailable)$/, causes as DriftCause[])[0] }/>

                <TimeDistributionPlot title='Waiting times distribution' data = { findCause(/(waiting-time)$/, causes as DriftCause[])[0] }/>
                <TimeDistributionPlot title='Waiting times due to batching' data = { findCause(/(waiting-time\/batching)$/, causes as DriftCause[])[0] }/>
                <TimeDistributionPlot title='Waiting times due to contention' data = { findCause(/(waiting-time\/contention)$/, causes as DriftCause[])[0] }/>
                <TimeDistributionPlot title='Waiting times due to prioritization' data = { findCause(/(waiting-time\/prioritization)$/, causes as DriftCause[])[0] }/>
                <TimeDistributionPlot title='Waiting times due to unavailability' data = { findCause(/(waiting-time\/unavailability)$/, causes as DriftCause[])[0] }/>
                <TimeDistributionPlot title='Waiting times due to extraneous factors' data = { findCause(/(waiting-time\/extraneous)$/, causes as DriftCause[])[0] }/>

                <RatePlot title='Arrival rate' data = { findCause(/(arrival-rates)/, causes as DriftCause[])[0] }/>
                <RatePlot title='Service rate' data = { findCause(/(service-rates)/, causes as DriftCause[])[0] }/>
                <CalendarPlot title='Resource calendars' data = { findCause(/(calendars)/, causes as DriftCause[])[0] }/>
                <PoliciesPlot title='Batching policies' data = { findCause(/(batch-creation)|(batch-firing)/, causes as DriftCause[]) }/>
                <PoliciesPlot title='Prioritization policies' data = { findCause(/prioritization-policies/, causes as DriftCause[]) }/>

                <ActivityProfilePlots title='Activity profile' data = { findCause(/activity-profiles/, causes as DriftCause[])[0] }/>
                <ResourceProfilePlots title='Resource profiles' data = { findCause(/resource-profiles/, causes as DriftCause[])[0] }/>
            </div>
        </div>
    </>
}