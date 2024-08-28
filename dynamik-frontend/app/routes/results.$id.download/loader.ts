import { LoaderFunctionArgs } from '@remix-run/node'

import { readFromFile } from '~/utils/filemanager.server'

export default async function loader({params}: LoaderFunctionArgs) {
    try {
        const content = await readFromFile('results', `${params.id}.result.json`, value => value)

        return new Response(content, {
            headers: {
                'Content-Disposition': `attachment; filename=${params.id}.json`,
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
