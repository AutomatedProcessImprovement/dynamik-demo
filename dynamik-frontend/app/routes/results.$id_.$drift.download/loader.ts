import { readFromFile } from '~/utils/filemanager.server'

import type { LoaderFunctionArgs } from '@remix-run/node'

export default async function loader({params}: LoaderFunctionArgs) {
    try {
        const content = await readFromFile('results', `${params.id}.result.${params.drift}.json`, value => value)

        return new Response(content, {
            headers: {
                'Content-Disposition': `attachment; filename=${params.id}.drift_${params.drift}.json`,
                'Content-Type': 'application/json',
            },
        })
    } catch {
        throw new Response(null, {
            status: 404,
            statusText: 'Not Found',
        })
    }
}
