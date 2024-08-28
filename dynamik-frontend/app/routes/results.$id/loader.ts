import { json } from '@remix-run/node'

import { readFromFile } from '~/utils/filemanager.server'

import type { LoaderFunctionArgs } from '@remix-run/node'
import type {ExecutionStatus, Experiment} from '~/types'

export default async function loader({params}: LoaderFunctionArgs) {
    try {
        const experiment = await readFromFile(
            'results',
            `${params.id}.config.json`,
            content => JSON.parse(content) as Experiment
        )
         const results = await readFromFile(
            'results',
            `${params.id}.result.json`,
            content => JSON.parse(content) as ExecutionStatus
        )
        return json({experiment, results})
    } catch {
        throw new Response(null, {
            status: 404,
            statusText: 'Not Found',
        })
    }

}
