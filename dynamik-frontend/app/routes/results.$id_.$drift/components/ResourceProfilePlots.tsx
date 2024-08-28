import {clsx} from 'clsx/lite';
import {
    Bar,
    BarChart,
    Brush,
    Cell, Label,
    Legend, ReferenceArea,
    ReferenceLine,
    ResponsiveContainer, ScatterChart,
    XAxis,
    YAxis
} from 'recharts';

import type {DriftCause} from '~/types'

interface Props {
    title: string
    data: DriftCause | undefined
}

interface InputData {
    resources: string[]
    utilization_index: {
        [resource: string]: number
    }
    performance_deviation: {
        [resource: string]: {
            [activity: string]: number[]
        }
    }
    collaboration_index: {
        resources: [string, string],
        count: number
    }[]
    effort_distribution: {
        [resource: string]: {
            owner: string[],
            calendar: {
                weekday: string,
                hour: number,
                value: number
            }[]
        }
    }
    instance_count: {
        [resource: string]: number
    }
}

interface PreparedUtilizationData {
    resource: string
    ref: number
    run: number
}
interface PreparedWorkDistributionData {
    resource: string
    ref: number
    run: number
    diff: number
}
interface PreparedCollaborationData {
    resource1: string
    resource2: string
    x: number,
    y: number,
    diff: number
}
interface PreparedPerformanceDeviationData {
    resource: string
    ref: number
    run: number
    diff: number
}
interface PreparedEffort{
    x: number
    y: number
    diff: number
    opacity: number
}

function prepareUtilizationData(reference: InputData, running: InputData): PreparedUtilizationData[] {
    const ref = reference.utilization_index
    const run = running.utilization_index
    const resources = reference.resources.toSorted((a, b) => a > b ? 1 : a === b ? 0 : -1)

    return resources.map(resource => {
        return {
            resource,
            ref: ref[resource],
            run: run[resource],
        }
    })
}
function prepareWorkDistributionData(reference: InputData, running: InputData): PreparedWorkDistributionData[] {
    const ref = reference.instance_count
    const run = running.instance_count
    const resources = reference.resources

    const totals = {
        ref: Object.values(ref).reduce((prev, curr) => prev + curr),
        run: Object.values(run).reduce((prev, curr) => prev + curr),
    }

    return resources.map(resource => {
        return {
            resource,
            ref: ref[resource] / totals.ref,
            run: run[resource] / totals.run,
            diff: ref[resource] / totals.ref - run[resource] / totals.run,
        }
    })
}
function prepareCollaborationData(reference: InputData, running: InputData): PreparedCollaborationData[] {
    const ref: { [resource: string]: { [resource: string]: number } } = {}
    const run: { [resource: string]: { [resource: string]: number } } = {}

    const resources = reference.resources.toSorted((a, b) => a > b ? 1 : a === b ? 0 : -1)

    for (const {resources: [resource0, resource1], count} of reference.collaboration_index) {
        if (!ref[resource0]) {
            ref[resource0] = {}
        }
        if (!ref[resource1]) {
            ref[resource1] = {}
        }
        ref[resource0][resource1] = count
        ref[resource1][resource0] = count
    }

    for (const {resources: [resource0, resource1], count} of running.collaboration_index) {
        if (!run[resource0])
            run[resource0] = {}
        if (!run[resource1])
            run[resource1] = {}

        run[resource0][resource1] = count
        run[resource1][resource0] = count
    }

    return resources.flatMap((resource1, idx1) => {
        return resources.map((resource2, idx2) => {
            return {
                resource1,
                resource2,
                x: idx1,
                y: idx2,
                diff: ref[resource1][resource2] - run[resource1][resource2]
            }
        })
    })
}
function preparePerformanceDeviationData(reference: InputData, running: InputData): PreparedPerformanceDeviationData[] {
    const ref = reference.performance_deviation
    const run = running.performance_deviation
    const resources = reference.resources

    return resources.toSorted().map(resource => {
        const _ref = (Object.values(ref[resource])
                .flat()
                .reduce((prev, curr) => prev + curr)
            / Object.values(ref[resource]).flat().length) - 1

        const _run = (Object.values(run[resource])
                .flat()
                .reduce((prev, curr) => prev + curr)
            / Object.values(run[resource]).flat().length) - 1

        return {
            ref: _ref,
            run: _run,
            diff: _run - _ref,
            resource
        }
    })
}
function prepareEffortData(reference: InputData, running: InputData): PreparedEffort[] {
    const dayMapping: { [key:string]: number } = {
        'Monday': 0,
        'Tuesday': 1,
        'Wednesday': 2,
        'Thursday': 3,
        'Friday': 4,
        'Saturday': 5,
        'Sunday': 6,
    }

    console.log(reference.effort_distribution)

    const ref = Object.values(
        Object.groupBy(
            Object.values(reference.effort_distribution).flatMap(({calendar}) => calendar),
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
            Object.values(running.effort_distribution).flatMap(({calendar}) => calendar),
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
                Under-performing
            </span>
        case 'run': return <span className = 'flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-slate-50'>
                <span className='size-4 bg-green-500'/>
                Over-performing
            </span>
    }
}
function legendFormatter3(value: string) {
    switch(value) {
        case 'ref': return <span className = 'flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-slate-50'>
                <span className='size-4 bg-red-500'/>
                Workload reduced
            </span>
        case 'run': return <span className = 'flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-slate-50'>
                <span className='size-4 bg-green-500'/>
                Workload increased
            </span>
    }
}

export default function ResourceProfilePlots({title, data}: Props) {
    if (data === undefined)
        return

    const dayMapping = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

    const utilizationData = prepareUtilizationData(data.reference as InputData, data.running as InputData)
    const workDistributionData = prepareWorkDistributionData(data.reference as InputData, data.running as InputData)
    const collaborationData = prepareCollaborationData(data.reference as InputData, data.running as InputData)
    const performanceDeviationData = preparePerformanceDeviationData(data.reference as InputData, data.running as InputData)
    const effortData = prepareEffortData(data.reference as InputData, data.running as InputData)

    return <details className='mb-4 w-full break-inside-avoid' open>
        <summary className='flex cursor-pointer hover:underline'>
            <h1 className='text-left text-2xl font-medium'>{title}</h1>
        </summary>
        <div className='my-4 ml-4 flex flex-col gap-4 border-l-2 pl-4'>
            <div>
                <h2 className='text-left text-lg font-medium'>Utilization index</h2>
                <div className='-mt-4 ml-4'>
                    <ResponsiveContainer width='100%' height={300}>
                        <BarChart data={utilizationData}
                                  className='fill-slate-400 stroke-slate-400 dark:fill-slate-500 dark:stroke-slate-500'
                                  barGap={0}
                                  barCategoryGap={'5%'}
                        >
                            <XAxis dataKey='resource'
                                   tick={{fontSize: '0.9rem', fill: 'inherit', fontWeight: '500'}}
                                   axisLine={{stroke: 'inherit'}}
                            />
                            <YAxis scale='linear'
                                   axisLine={{stroke: 'inherit'}}
                                   width={32}
                                   tickFormatter={value => `${Math.round(parseFloat(value) * 100)}%`}
                                   tick={{fontFamily: 'monospace', fontSize: '0.8rem', fontWeight: '500'}}
                                   tickLine={false}
                                   domain={[0, 1]}
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
                            <Brush dataKey='resource'
                                   height={30}
                                   stroke='inherit'
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
            <div>
                <h2 className='text-left text-lg font-medium'>Performance deviation</h2>
                <div className='-mt-4 ml-4'>
                    <ResponsiveContainer width='100%' height={300}>
                        <BarChart data={performanceDeviationData}
                                  className='fill-slate-400 stroke-slate-400 dark:fill-slate-500 dark:stroke-slate-500'
                                  barGap={0}
                                  barCategoryGap={'5%'}
                        >
                            <XAxis dataKey='resource'
                                   tick={{fontSize: '0.9rem', fill: 'inherit', fontWeight: '500'}}
                                   axisLine={{stroke: 'inherit'}}
                            />
                            <YAxis scale='linear'
                                   axisLine={{stroke: 'inherit'}}
                                   width={48}
                                   tickFormatter={value => `${parseFloat(value).toFixed(2)}%`}
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
                                    performanceDeviationData.map((entry, index) => {
                                        return <Cell key={`cell-${index}`}
                                                     fill='inherit'
                                                     className={clsx(
                                                         entry.diff < 0 && 'fill-red-500',
                                                         entry.diff > 0 && 'fill-green-500',
                                                     )}/>
                                    })
                                }
                            </Bar>
                            <Legend iconSize={0}
                                    verticalAlign='top'
                                    formatter={legendFormatter2}
                                    payload={[{value: 'ref'}, {value: 'run'}]}
                            />
                            <Brush dataKey='resource'
                                   height={30}
                                   stroke='inherit'
                            />
                            <ReferenceLine y={0} stroke='inherit'/>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
            <div>
                <h2 className='text-left text-lg font-medium'>Collaboration index</h2>
                <div className='ml-4'>
                    <ResponsiveContainer width='100%' height={(data.reference as InputData).resources.length * 36}>
                        <ScatterChart data={collaborationData}
                                      className='fill-slate-700 stroke-slate-400 dark:fill-slate-500 dark:stroke-slate-500'>
                            <XAxis dataKey='x'
                                   axisLine={{stroke: 'inherit'}}
                                   type='number'
                                   scale='linear'
                                   ticks={[...(new Array((data.reference as InputData).resources.length).keys())]}
                                   tick={{fontSize: '0.8rem', fill: 'inherit'}}
                                   tickLine={false}
                                   tickFormatter={value => (data.reference as InputData).resources.toSorted()[value]}
                                   domain={[-0.5, (data.reference as InputData).resources.length - 0.5]}
                                   height={50}
                            />
                            <YAxis dataKey='y'
                                   type='number'
                                   axisLine={{stroke: 'inherit'}}
                                   overflow={'none'}
                                   ticks={[...(new Array((data.reference as InputData).resources.length).keys())]}
                                   tick={{fontSize: '.8rem', fill: 'inherit'}}
                                   tickFormatter={value => (data.reference as InputData).resources.toSorted()[value]}
                                   tickLine={false}
                                   domain={[-0.5, (data.reference as InputData).resources.length - 0.5]}
                                   interval={0}
                                   width={64}
                                   includeHidden
                            />
                            <Legend verticalAlign='top'
                                    iconSize={18}
                                    formatter={(value: string) => {
                                        return <span
                                            className='text-sm font-medium text-slate-900 dark:text-slate-50'>{value}</span>
                                    }}
                                    payload={[
                                        {value: 'More collaborations', type: 'rect', color: '#22c55e'},
                                        {value: 'Less collaborations', type: 'rect', color: '#ef4444'},
                                    ]}
                            />
                            {
                                collaborationData.map(({resource1, resource2, diff, x, y}) => {
                                    return <ReferenceArea key={`${resource1}-${resource2}`}
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
                <h2 className='text-left text-lg font-medium'>Circadian effort distribution</h2>
                <div className='ml-4'>
                    <ResponsiveContainer width='100%' height={300}>
                        <ScatterChart
                            className='fill-slate-700 stroke-slate-400 dark:fill-slate-500 dark:stroke-slate-500'>
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
                                        {value: 'More activity', type: 'rect', color: '#22c55e'},
                                        {value: 'Less activity', type: 'rect', color: '#ef4444'},
                                    ]}
                            />
                            {
                                effortData.map(({x, y, diff, opacity}) => {
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
                <h2 className='text-left text-lg font-medium'>Work distribution</h2>
                <div className='-mt-4 ml-4'>
                    <ResponsiveContainer width='100%' height={300}>
                        <BarChart data={workDistributionData}
                                  className='fill-slate-400 stroke-slate-400 dark:fill-slate-500 dark:stroke-slate-500'
                                  barGap={0}
                                  barCategoryGap={'5%'}
                        >
                            <XAxis dataKey='resource'
                                   tick={{fontSize: '0.9rem', fill: 'inherit', fontWeight: '500'}}
                                   axisLine={{stroke: 'inherit'}}
                            />
                            <YAxis scale='linear'
                                   axisLine={{stroke: 'inherit'}}
                                   width={48}
                                   tickFormatter={value => `${parseFloat(value).toFixed(2)}%`}
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
                                    workDistributionData.map((entry, index) => {
                                        return <Cell key={`cell-${index}`}
                                                     fill='inherit'
                                                     className={clsx(
                                                         entry.diff < 0 && 'fill-red-500',
                                                         entry.diff > 0 && 'fill-green-500',
                                                     )}/>
                                    })
                                }
                            </Bar>
                            <Legend iconSize={0}
                                    verticalAlign='top'
                                    formatter={legendFormatter3}
                                    payload={[{value: 'ref'}, {value: 'run'}]}
                            />
                            <Brush dataKey='resource'
                                   height={30}
                                   stroke='inherit'
                            />
                            <ReferenceLine y={0} stroke='inherit'/>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    </details>
}