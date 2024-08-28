import {
    ArrowTrendingUpIcon as LineIcon
} from '@heroicons/react/24/solid'
import { formatDistanceStrict as formatDistance } from 'date-fns'
import {
    ComposedChart, Legend, Line, ReferenceLine, ResponsiveContainer, XAxis, YAxis
} from 'recharts'

import type { DriftCause } from '~/types'

function prepareData(reference: number[], running: number[]) {
    const length = Math.max(reference.length, running.length)
    const ref = reference.toSorted((a, b) => a - b)
    const run = running.toSorted((a, b) => a - b)

    return {
        data: [...new Array(length).keys()].map(idx => {
            return {
                index: idx,
                ref: ref[idx],
                run: run[idx]
            }
        }),
        avg: {
            ref: ref.reduce((a, b) => a + b, 0) / ref.length,
            run: run.reduce((a, b) => a + b, 0) / run.length,
        },
        min: {
            ref: Math.min(...ref),
            run: Math.min(...run)
        },
        max: {
            ref: Math.max(...ref),
            run: Math.max(...run)
        },
        length: {
            ref: ref.length,
            run: run.length
        }
    }
}
function legendFormatter(value: string) {
    switch(value) {
        case 'ref':
            return <span className = 'flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-slate-50'>
                <LineIcon className='size-4 stroke-amber-500 stroke-2'/>
                Reference
            </span>
        case 'run':
            return <span className = 'flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-slate-50'>
                <LineIcon className='ml-4 size-4 stroke-teal-500 stroke-2'/>
                Running
            </span>
    }
}

interface Props {
    title: string
    data: DriftCause | undefined
}

export default function TimeDistributionPlot({title, data: _data}: Props) {
    if (_data === undefined)
        return

    const {
        data,
        avg,
        length,
        max
    } = prepareData(_data.reference as number[], _data.running as number[])

    return <details className='w-full break-inside-avoid' open>
        <summary className='flex cursor-pointer hover:underline'>
            <h1 className='text-left text-2xl font-medium'>{title}</h1>
        </summary>
        <div className='my-4 ml-4 border-l-2 pl-4'>
            <div className='flex items-center justify-between gap-4'>
                <div className='flex flex-col text-left'>
                    <h2>Reference mean</h2>
                    <div>
                        <p className='text-3xl font-medium'>{formatDistance(0, avg.ref * 1000)}</p>
                    </div>
                </div>
                <div className='flex flex-col text-right'>
                    <h2>Current mean</h2>
                    <div>
                        <p className='text-3xl font-medium'>{formatDistance(0, avg.run * 1000)}</p>
                    </div>
                </div>
            </div>
            <div className='-mt-4'>
                <ResponsiveContainer width='100%' height={300}>
                    <ComposedChart data={data} className='stroke-slate-950 dark:stroke-slate-500'>
                        <XAxis dataKey='index'
                               axisLine={{stroke: 'inherit'}}
                               domain={[0, length.ref - 1]}
                               max={length.ref - 1}
                               scale='linear'
                               type='number'
                               tick={false}
                               height={12}
                               xAxisId={0}
                               allowDataOverflow
                        />
                        <XAxis dataKey='index'
                               domain={[0, length.run - 1]}
                               max={length.run - 1}
                               scale='linear'
                               type='number'
                               tick={false}
                               height={12}
                               xAxisId={1}
                               hide
                        />
                        <YAxis scale='linear'
                               axisLine={{stroke: 'inherit'}}
                               width={1}
                               ticks={[avg.ref, avg.run]}
                               tick={{fontSize: '0', fontWeight: '500'}}
                               tickLine={false}
                               domain={[0, Math.max(max.ref, max.run)]}
                        />
                        <Legend iconSize={0}
                                verticalAlign='top'
                                formatter={legendFormatter}
                        />
                        <Line type='monotone'
                              className='stroke-amber-500'
                              dataKey='ref'
                              dot={false}
                              strokeWidth='2'
                              stroke='inherit'
                              xAxisId={0}
                        />
                        <Line type='monotone'
                              className='stroke-teal-500'
                              dataKey='run'
                              dot={false}
                              strokeWidth='2'
                              stroke='inherit'
                              xAxisId={1}
                        />
                        <ReferenceLine y={avg.ref}
                                       className='stroke-amber-700'
                                       stroke='inherit'
                                       strokeWidth={2}
                                       strokeDasharray='3 3'
                        />
                        <ReferenceLine y={avg.run}
                                       className='stroke-teal-700'
                                       stroke='inherit'
                                       strokeWidth={2}
                                       strokeDasharray='3 3'
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>
    </details>
}