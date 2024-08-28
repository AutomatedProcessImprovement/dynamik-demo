import {json} from '@remix-run/node'

import { readFromFile } from '~/utils/filemanager.server'

import type { LoaderFunctionArgs } from '@remix-run/node'
import type { DriftDetails } from '~/types'

export default async function loader({params}: LoaderFunctionArgs) {
    try {
        const content = await readFromFile(
            'results',
            `${params.id}.result.${params.drift}.json`,
            content => JSON.parse(content) as DriftDetails
        )
        return json(content)
    } catch {
        throw new Response(null, {
            status: 404,
            statusText: 'Not Found',
        })
    }
}