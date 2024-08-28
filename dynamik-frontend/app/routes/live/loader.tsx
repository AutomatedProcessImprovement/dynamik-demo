import { ActionFunctionArgs } from '@remix-run/node'

import { EventStream } from '@remix-sse/server'

import { RabbitClient } from '~/utils/queue.server'

export default async function loader({request}: ActionFunctionArgs) {
    const id = new URL(request.url).searchParams.get('id') as string

    try {
        return new EventStream(request, (send) => {
            const client = RabbitClient.subscribeToLiveUpdates(
                id,
                msg => {
                    try{
                        send(JSON.stringify(msg), { channel: id })
                    } catch (e) {
                        console.error(e)
                    }
                }
            )

            return () => {
                try {
                    client.close()
                } catch (e) {
                    console.error(e)
                }
            }
        })
    } catch (e) {
        console.error(e)
    }
}

