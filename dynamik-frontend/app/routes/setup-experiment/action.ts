import { redirect } from '@remix-run/node'

import { hash } from 'hasha'

import { existsFile, storeFiles, writeToFile } from '~/utils/filemanager.server'
import { RabbitClient } from '~/utils/queue.server'
import { sleep } from '~/utils/sleep'

import type { ActionFunctionArgs } from '@remix-run/node'
import type { ExecutionStatus, Experiment } from '~/types'

export default async function action({request}: ActionFunctionArgs) {
    const process = async () => {
        const body = await request.formData()
        const files = body.getAll('files') as File[]
        const email = (body.get('email') || '') as string

        const filenames = await storeFiles('logs', files)
        const config = JSON.parse(body.get('config') as string)
        const mapping = JSON.parse(body.get('mapping') as string)

        const invariantExperiment = {
            email: email,
            config: config,
            mapping: mapping,
            logs: filenames
        }

        const experiment: Experiment = {
            id: await hash(JSON.stringify(invariantExperiment), {algorithm: 'md5'}),
            submitted: (new Date()).toISOString(),
            ...invariantExperiment,
        }

        if (!existsFile('results', `${experiment.id}.config.json`)) {
            const queued: ExecutionStatus = {
                status: {
                    status: 'queued',
                    progress: 0,
                    currentRef: ['', ''],
                    currentRun: ['', ''],
                },
                lastUpdateDate: experiment.submitted,
                drifts: []
            }

            await Promise.all([
                writeToFile('results', `${experiment.id}.config.json`, JSON.stringify(experiment, null, 2)),
                writeToFile('results', `${experiment.id}.result.json`, JSON.stringify(queued, null, 2)),
                RabbitClient.publishExperiment(experiment)
            ])
        }

        return experiment.id
    }

    const [experimentId] = await Promise.all([
        process(),
        sleep(3000)
    ])

    return redirect(`/results/${experimentId}`)
}