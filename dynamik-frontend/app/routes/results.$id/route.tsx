import { useLoaderData, useParams } from '@remix-run/react'

import { useEventStream } from '@remix-sse/client'

import { ExecutionStatus } from '~/types'

import { Drift, Summary } from './components'
import loader from './loader'

export { loader }

export default function Results() {
    const {
        experiment,
        results
    } = useLoaderData<typeof loader>()
    const params = useParams()

    const live: ExecutionStatus = useEventStream(`/live?id=${params.id}`,
        {
            deserialize: raw=> JSON.parse(raw) as ExecutionStatus,
            returnLatestOnly: true,
            channel: params.id
        }
    )

    return <div className='flex min-h-96 w-full flex-col gap-8'>
        <Summary drifts={ live?.drifts || results.drifts }
                 status={ live?.status || results.status }
                 lastUpdateDate={ live?.lastUpdateDate || results.lastUpdateDate }
                 submissionDate={ experiment.submitted }
                 config={ experiment.config }
        />
        <ol className='flex max-h-[40vh] min-h-[40vh] flex-col gap-4 overflow-y-auto px-2'>
            { (live?.drifts || results.drifts).map((drift: {
                index: number
                referenceWindow: string[]
                runningWindow: string[]
                description: string
            }) => <Drift key={drift.index} drift={drift}/>) }
        </ol>
    </div>
}

