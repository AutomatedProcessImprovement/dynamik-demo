import { hostname } from 'node:os'

import { Connection } from 'rabbitmq-client'
import { v4 as uuid } from 'uuid'

import type { Experiment } from '~/types'

export class RabbitClient {
    private static connection: Connection

    private constructor() {}

    private static connect() {
        const host = process.env.RABBITMQ_HOST || 'localhost'
        const port = process.env.RABBITMQ_PORT ? parseInt(process.env.RABBITMQ_PORT) : 5672
        const user = process.env.RABBITMQ_USER || 'guest'
        const pass = process.env.RABBITMQ_PASS || 'guest'

        if (RabbitClient.connection == null) {
            try {
                RabbitClient.connection = new Connection({
                    connectionName: `client-${hostname()}@dynamik`,
                    hostname: host,
                    port: port,
                    username: user,
                    password: pass,
                })

                RabbitClient.connection.on('error', (err) => {
                    console.error('RabbitMQ connection error', err)
                })

                RabbitClient.connection.on('connection', () => {
                    console.log('Connection successfully (re)established')
                })
            } catch (error) {
                console.error('RabbitMQ connection error', error)
            }
        }

        return RabbitClient.connection
    }

    public static subscribeToLiveUpdates(
        topic: string,
        onMessage: (msg: object) => void,
    ) {
        const queue = `${uuid()}:live@dynamik`
        return this.connect().createConsumer(
            {
                exchanges: [
                    {
                        exchange: process.env.LIVE_STATUS_EXCHANGE || 'status@dynamik',
                        type: 'direct',
                        durable: true
                    }
                ],
                queueOptions: {
                    durable: false,
                    autoDelete: true,
                    queue: queue,
                    exclusive: true,
                },
                queue: queue,
                exclusive: true,
                noAck: true,
                queueBindings: [
                    {
                        exchange: process.env.LIVE_STATUS_EXCHANGE || 'status@dynamik',
                        routingKey: topic,
                        queue: queue
                    }
                ]
            },
            async message => {
                onMessage(message.body)
            }
        )
    }

    public static async publishExperiment(
        data: Experiment
    ) {
        const queue = process.env.EXPERIMENTS_QUEUE || 'experiments@dynamik'
        return await this.connect().createPublisher(
            {
                confirm:true,
                queues: [
                    {
                        queue: queue,
                        durable: true
                    }
                ],
            }
        ).send(queue, data)
    }
}