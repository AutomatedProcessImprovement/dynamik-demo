import {clsx} from 'clsx/lite'
import {
    Bar,
    BarChart, Brush, Cell,
    Label,
    Legend,
    ReferenceArea,
    ReferenceLine,
    ResponsiveContainer,
    ScatterChart,
    XAxis,
    YAxis
} from 'recharts'

import type { DriftCause } from '~/types'

interface Props {
    title: string
    data: DriftCause | undefined
}

interface InputData {
    activities: string[]
    activity_frequency: {
        [activity: string]: number
    }
    arrival_distribution: {
        [activity: string]: {
            owner: string[],
            calendar: {
                weekday: string,
                hour: number,
                value: number
            }[]
        }
    }
    co_occurrence_index: {
        activities: [string, string],
        count: number
    }[]
    complexity_deviation: {
        [activity: string]: number[]
    }
    demand: {
        [activity: string]: number
    }
}

interface PreparedFrequencyData {
    ref: number
    run: number
    activity: string
}
interface PreparedDemandData {
    ref: number
    run: number
    diff: number
    activity: string
}
interface PreparedArrivals{
    x: number
    y: number
    diff: number
    opacity: number
}
interface PreparedCoOccurrences{
    activities: string[]
    count: number
    cooccurrences: {
        activity1: string
        activity2: string
        x: number,
        y: number,
        diff: number
    }[]
}
interface PreparedDeviation{
    ref: number
    run: number
    diff: number
    activity: string
}

function prepareFrequencyData(reference: InputData, running: InputData): PreparedFrequencyData[] {
    const totals = {
        ref: Object.values(reference.activity_frequency).reduce((v1, v2) => v1 + v2),
        run: Object.values(running.activity_frequency).reduce((v1, v2) => v1 + v2),
    }

    return Object.keys(reference.activity_frequency)
        .map((activity) => ({
            activity,
            ref: reference.activity_frequency[activity] / totals.ref,
            run: running.activity_frequency[activity] / totals.run,
        })).sort((a, b) => a.activity < b.activity ? -1 : 1)
}
function prepareDemandData(reference: InputData, running: InputData): PreparedDemandData[] {
    return Object.keys(reference.demand)
        .map((activity) => ({
            activity,
            ref: reference.demand[activity],
            run: running.demand[activity],
            diff: reference.demand[activity] - running.demand[activity],
        })).sort((a, b) => a.activity < b.activity ? -1 : 1)
}
function prepareArrivals(reference: InputData, running: InputData): PreparedArrivals[] {
    const dayMapping: { [key:string]: number } = {
        'Monday': 0,
        'Tuesday': 1,
        'Wednesday': 2,
        'Thursday': 3,
        'Friday': 4,
        'Saturday': 5,
        'Sunday': 6,
    }

    const ref = Object.values(
        Object.groupBy(
            Object.values(reference.arrival_distribution).flatMap(entry => entry.calendar),
            ({weekday, hour}) => `${weekday}, ${hour}`
        )
    ).map(entries => {
        return {
            ...entries?.[0],
            weekday: dayMapping[entries !== undefined ? entries[0].weekday : ''],
            value: entries?.map(({value}) => value).reduce((prev, curr) => prev+curr)
        }
    })

    const run = Object.values(
        Object.groupBy(
            Object.values(running.arrival_distribution).flatMap(entry => entry.calendar),
            ({weekday, hour}) => `${weekday}, ${hour}`
        )
    ).map(entries => {
        return {
            ...entries?.[0],
            weekday: dayMapping[entries !== undefined ? entries[0].weekday : ''],
            value: entries?.map(({value}) => value).reduce((prev, curr) => prev+curr)
        }
    })

    let minDiff = Number.MAX_SAFE_INTEGER
    let maxDiff = Number.MIN_SAFE_INTEGER

    const diff = [...(new Array(7)).keys()].map(_day => {
        return [...(new Array(24)).keys()].map(_hour => {
            const _ref = ref.find(({hour, weekday}) => hour === _hour && weekday === _day)?.value || 0
            const _run = run.find(({hour, weekday}) => hour === _hour && weekday === _day)?.value || 0

            minDiff = Math.min(minDiff, _run - _ref)
            maxDiff = Math.max(maxDiff, _run - _ref)

            return {
                diff: _run - _ref,
            }
        })
    })

    return diff.flatMap((hours, day) => {
        return hours.map(({diff}, hour) => {
            return {
                x: hour,
                y: day,
                diff,
                opacity: diff > 0
                    ? Math.round((diff / maxDiff) * 10) / 10
                    : Math.round((Math.abs(diff) / Math.abs(minDiff)) * 10) / 10
            }
        })
    })
}
function prepareCoOccurrences(reference: InputData, running: InputData): PreparedCoOccurrences {
    const ref: { [activity: string]: { [activity: string]: number } } = {}
    const run: { [activity: string]: { [activity: string]: number } } = {}

    const activities = reference.activities.toSorted((a, b) => a < b ? -1 : a > b ? 1 : 0)

    for (const {activities, count} of reference.co_occurrence_index) {
        if (!ref[activities[0]]) {
            ref[activities[0]] = {}
        }
        if (!ref[activities[1]]) {
            ref[activities[1]] = {}

        }
        ref[activities[0]][activities[1]] = count
        ref[activities[1]][activities[0]] = count
    }

    for (const {activities, count} of running.co_occurrence_index) {
        if (!run[activities[0]])
            run[activities[0]] = {}
        if (!run[activities[1]])
            run[activities[1]] = {}

        run[activities[0]][activities[1]] = count
        run[activities[1]][activities[0]] = count
    }

    return {
        activities: activities,
        count: activities.length,
        cooccurrences: activities
            .flatMap((activity1, idx1) => {
                return activities.map((activity2, idx2) => {
                    return {
                        activity1,
                        activity2,
                        x: idx1,
                        y: idx2,
                        diff: ref[activity1][activity2] - run[activity1][activity2]
                    }
                })
            })
    }
}
function prepareEffortDeviation(reference: InputData, running: InputData): PreparedDeviation[] {
    const ref = reference.complexity_deviation
    const run = running.complexity_deviation
    const activities = reference.activities

    return activities.toSorted().map(activity => {
        const _ref = (ref[activity].reduce((prev, curr) => prev + curr) / ref[activity].length) - 1
        const _run = (run[activity].reduce((prev, curr) => prev + curr) / run[activity].length) - 1

        return {
            ref: _ref,
            run: _run,
            diff: _ref - _run,
            activity
        }
    })
}

function legendFormatter(value: string) {
    switch(value) {
        case 'ref': return <span className = 'flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-slate-50'>
                <span className='size-4 bg-amber-500'/>
                Reference
            </span>
        case 'run': return <span className = 'flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-slate-50'>
                <span className='size-4 bg-teal-500'/>
                Running
            </span>
    }
}
function legendFormatter2(value: string) {
    switch(value) {
        case 'ref': return <span className = 'flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-slate-50'>
                <span className='size-4 bg-red-500'/>
                Less complex
            </span>
        case 'run': return <span className = 'flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-slate-50'>
                <span className='size-4 bg-green-500'/>
                More complex
            </span>
    }
}
function legendFormatter3(value: string) {
    switch(value) {
        case 'ref': return <span className = 'flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-slate-50'>
                <span className='size-4 bg-red-500'/>
                Less demanding
            </span>
        case 'run': return <span className = 'flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-slate-50'>
                <span className='size-4 bg-green-500'/>
                More demanding
            </span>
    }
}

export default function ActivityProfilePlots({title, data}: Props) {
    if (data === undefined)
        return

    const dayMapping = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

    const frequencies = prepareFrequencyData(data.reference as InputData, data.running as InputData)
    const demand = prepareDemandData(data.reference as InputData, data.running as InputData)
    const arrivals = prepareArrivals(data.reference as InputData, data.running as InputData)
    const coOccurrences = prepareCoOccurrences(data.reference as InputData, data.running as InputData)
    const deviations = prepareEffortDeviation(data.reference as InputData, data.running as InputData)

    return <details open>
        <summary className='flex cursor-pointer hover:underline'>
            <h1 className='text-left text-2xl font-medium'>{title}</h1>
        </summary>
        <div className='my-4 ml-4 flex flex-col gap-4 border-l-2 pl-4'>
            <div>
                <h2 className='text-left text-lg font-medium'>Activity frequency</h2>
                <div className='-mt-4 ml-4'>
                    <ResponsiveContainer width='100%' height={300}>
                        <BarChart data={frequencies}
                                  className='fill-slate-400 stroke-slate-400 dark:fill-slate-500 dark:stroke-slate-500'
                                  barGap={0}
                        >
                            <XAxis dataKey='activity'
                                   axisLine={{stroke: 'inherit'}}
                                   tick={{fontSize: '0.9rem', fill: 'inherit', fontWeight: '500'}}
                            />
                            <YAxis scale='linear'
                                   axisLine={{stroke: 'inherit'}}
                                   width={32}
                                   tickFormatter={value => `${Math.round(parseFloat(value) * 100)}%`}
                                   tick={{fontFamily: 'monospace', fontSize: '0.8rem', fontWeight: '500'}}
                                   tickLine={false}
                                   domain={[0, (dataMax: number) => dataMax + (dataMax/10)]}
                            />
                            <Bar dataKey='ref'
                                 fill='inherit'
                                 stroke='none'
                                 className='fill-amber-500'
                            />
                            <Bar dataKey='run'
                                 fill='inherit'
                                 stroke='none'
                                 className='fill-teal-500'
                            />
                            <Legend iconSize={0}
                                    verticalAlign='top'
                                    formatter={legendFormatter}
                            />
                            <Brush dataKey='activity'
                                   height={24}
                                   stroke='inherit'
                                   strokeWidth={1}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
            <div>
                <h2 className='text-left text-lg font-medium'>Circadian arrival distribution</h2>
                <div className='ml-4'>
                    <ResponsiveContainer width='100%' height={300}>
                        <ScatterChart className='fill-slate-700 stroke-slate-400 dark:fill-slate-500 dark:stroke-slate-500'>
                            <XAxis dataKey='time'
                                   axisLine={{stroke: 'inherit'}}
                                   type='number'
                                   scale='linear'
                                   ticks={[...(new Array(25).keys())]}
                                   tick={{fontSize: '0.8rem', fill: 'inherit'}}
                                   domain={[0, 24]}
                                   height={50}
                            />
                            <YAxis dataKey='day'
                                   type='number'
                                   axisLine={{stroke: 'inherit'}}
                                   overflow={'none'}
                                   ticks={[...(new Array(7).keys())].map(x => x + 0.5)}
                                   domain={[0, 7]}
                                   tick={{fontSize: '.9rem', fill: 'inherit', fontFamily: 'monospace'}}
                                   tickFormatter={value => dayMapping[Math.floor(value)].slice(0, 3)}
                                   tickLine={false}
                                   interval={0}
                                   width={30}
                                   includeHidden
                            />
                            <Legend verticalAlign='top'
                                    iconSize={18}
                                    formatter={(value: string) => {
                                        return <span
                                            className='text-sm font-medium text-slate-900 dark:text-slate-50'>{value}</span>
                                    }}
                                    payload={[
                                        {value: 'More arrivals', type: 'rect', color: '#22c55e'},
                                        {value: 'Less arrivals', type: 'rect', color: '#ef4444'},
                                    ]}
                            />
                            {
                                arrivals.map(({x, y, diff, opacity}) => {
                                    return <ReferenceArea key={`${y}(${x}-${x + 1})`}
                                                          x1={x}
                                                          x2={x + 1}
                                                          y1={y}
                                                          y2={y + 1}
                                                          isFront
                                                          fillOpacity={opacity}
                                                          fill={'inherit'}
                                                          className={clsx(
                                                              diff > 0 && 'fill-green-500',
                                                              diff < 0 && 'fill-red-500',
                                                              diff === 0 && 'fill-slate-100 dark:fill-slate-800',
                                                          )}
                                    >
                                        <Label position='center'
                                               className={
                                                   clsx(
                                                       diff === 0 && 'fill-slate-400',
                                                       diff > 0 && 'fill-green-700 dark:fill-green-300',
                                                       diff < 0 && 'fill-red-700 dark:fill-red-300',
                                                       'text-sm', 'font-medium'
                                                   )
                                               }
                                               stroke='none'
                                        >
                                            {diff >= 0 ? `+${diff}` : diff}
                                        </Label>
                                    </ReferenceArea>
                                })
                            }
                        </ScatterChart>
                    </ResponsiveContainer>
                </div>
            </div>
            <div>
                <h2 className='text-left text-lg font-medium'>Co-occurrence index</h2>
                <div className='ml-4'>
                    <ResponsiveContainer width='100%' height={300}>
                        <ScatterChart data={coOccurrences.cooccurrences}
                                      className='fill-slate-700 stroke-slate-400 dark:fill-slate-500 dark:stroke-slate-500'>
                            <XAxis dataKey='x'
                                   axisLine={{stroke: 'inherit'}}
                                   type='number'
                                   scale='linear'
                                   ticks={[...(new Array(coOccurrences.count).keys())]}
                                   tick={{fontSize: '0.8rem', fill: 'inherit'}}
                                   tickLine={false}
                                   tickFormatter={value => coOccurrences.activities[value]}
                                   domain={[-0.5, coOccurrences.count - 0.5]}
                                   height={50}
                            />
                            <YAxis dataKey='y'
                                   type='number'
                                   axisLine={{stroke: 'inherit'}}
                                   overflow={'none'}
                                   ticks={[...(new Array(coOccurrences.count).keys())]}
                                   domain={[-0.5, coOccurrences.count - 0.5]}
                                   tick={{fontSize: '.9rem', fill: 'inherit', fontFamily: 'monospace'}}
                                   tickFormatter={value => coOccurrences.activities[value]}
                                   tickLine={false}
                                   interval={0}
                                   width={30}
                                   includeHidden
                            />
                            <Legend verticalAlign='top'
                                    iconSize={18}
                                    formatter={(value: string) => {
                                        return <span
                                            className='text-sm font-medium text-slate-900 dark:text-slate-50'>{value}</span>
                                    }}
                                    payload={[
                                        {value: 'More co-occurrences', type: 'rect', color: '#22c55e'},
                                        {value: 'Less co-occurrences', type: 'rect', color: '#ef4444'},
                                    ]}
                            />
                            {
                                coOccurrences.cooccurrences.map(({activity1, activity2, diff, x, y}) => {
                                    return <ReferenceArea key={`${activity1}-${activity2}`}
                                                          x1={x - 0.5}
                                                          x2={x + 0.5}
                                                          y1={y - 0.5}
                                                          y2={y + 0.5}
                                                          isFront
                                                          fill={'inherit'}
                                                          fillOpacity={Number.isNaN(diff) ? 0 : (Math.abs(diff) / 100)}
                                                          className={clsx(
                                                              diff > 0 && 'fill-green-500',
                                                              diff < 0 && 'fill-red-500',
                                                              (diff === 0 || Number.isNaN(diff)) && 'fill-slate-100 dark:fill-slate-800',
                                                          )}
                                    >
                                        <Label position='center'
                                               className={
                                                   clsx(
                                                       diff > 0 && 'fill-green-700',
                                                       diff < 0 && 'fill-red-700',
                                                       'text-sm', 'font-medium'
                                                   )
                                               }
                                               stroke='none'
                                        >
                                            {diff > 0 ? `+${diff}%` : diff < 0 ? `${diff}%` : ''}
                                        </Label>
                                    </ReferenceArea>
                                })
                            }
                        </ScatterChart>
                    </ResponsiveContainer>
                </div>
            </div>
            <div>
                <h2 className='text-left text-lg font-medium'>Complexity deviation</h2>
                <div className='-mt-4 ml-4'>
                    <ResponsiveContainer width='100%' height={300}>
                        <BarChart data={deviations}
                                  className='fill-slate-400 stroke-slate-400 dark:fill-slate-500 dark:stroke-slate-500'
                                  barGap={0}
                        >
                            <XAxis dataKey='activity'
                                   tick={{fontSize: '0.9rem', fill: 'inherit', fontWeight: '500'}}
                                   axisLine={{stroke: 'inherit'}}
                            />
                            <YAxis scale='linear'
                                   axisLine={{stroke: 'inherit'}}
                                   width={32}
                                   tickFormatter={value => `${Math.round(parseFloat(value) * 100)}%`}
                                   tick={{fontFamily: 'monospace', fontSize: '0.8rem', fontWeight: '500'}}
                                   tickLine={false}
                                   domain={
                                       ([dataMin, dataMax]) => {
                                           const absMax = Math.max(Math.abs(dataMin), Math.abs(dataMax))
                                           return [-absMax - (absMax / 10), absMax + (absMax / 10)]
                                       }
                                   }
                            />
                            <Bar dataKey='diff'
                                 fill='inherit'
                                 stroke='none'
                            >
                                {
                                    deviations.map((entry, index) => {
                                        return <Cell key={`cell-${index}`}
                                                     fill='inherit'
                                                     className={clsx(
                                                         entry.diff < 0 && 'fill-red-500',
                                                         entry.diff > 0 && 'fill-green-500',
                                                     )}
                                        />
                                    })
                                }
                            </Bar>
                            <ReferenceLine y={0} stroke='inherit'/>
                            <Legend iconSize={0}
                                    verticalAlign='top'
                                    payload={[{value: 'ref'}, {value: 'run'}]}
                                    formatter={legendFormatter2}
                            />
                            <Brush dataKey='activity'
                                   height={24}
                                   stroke='inherit'
                                   strokeWidth={1}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
            <div>
                <h2 className='text-left text-lg font-medium'>Effort demand</h2>
                <div className='-mt-4 ml-4'>
                    <ResponsiveContainer width='100%' height={300}>
                        <BarChart data={demand}
                                  className='fill-slate-400 stroke-slate-400 dark:fill-slate-500 dark:stroke-slate-500'
                                  barGap={0}
                        >
                            <XAxis dataKey='activity'
                                   tick={{fontSize: '0.9rem', fill: 'inherit', fontWeight: '500'}}
                                   axisLine={{stroke: 'inherit'}}
                            />
                            <YAxis scale='linear'
                                   axisLine={{stroke: 'inherit'}}
                                   width={32}
                                   tickFormatter={value => `${Math.round(parseFloat(value) * 100)}%`}
                                   tick={{fontFamily: 'monospace', fontSize: '0.8rem', fontWeight: '500'}}
                                   tickLine={false}
                                   domain={
                                       ([dataMin, dataMax]) => {
                                           const absMax = Math.max(Math.abs(dataMin), Math.abs(dataMax))
                                           return [-absMax - (absMax / 10), absMax + (absMax / 10)]
                                       }
                                   }
                            />
                            <Bar dataKey='diff'
                                 fill='inherit'
                                 stroke='none'
                            >
                                {
                                    demand.map((entry, index) => {
                                        return <Cell key={`cell-${index}`}
                                                     fill='inherit'
                                                     className={clsx(
                                                         entry.diff < 0 && 'fill-red-500',
                                                         entry.diff > 0 && 'fill-green-500',
                                                     )}
                                        />
                                    })
                                }
                            </Bar>
                            <ReferenceLine y={0} stroke='inherit'/>
                            <Legend iconSize={0}
                                    verticalAlign='top'
                                    payload={[{value: 'ref'}, {value: 'run'}]}
                                    formatter={legendFormatter3}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    </details>
}