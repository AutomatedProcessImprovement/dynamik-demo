import {clsx} from 'clsx/lite'
import {
    ResponsiveContainer,
    ScatterChart,
    XAxis,
    YAxis,
    Legend,
    Label,
    ReferenceArea,
} from 'recharts'

import type { DriftCause } from '~/types'

interface Props {
    title: string
    data: DriftCause | undefined
}

interface InputData {
    [resource: string]: {
        owner: string[]
        calendar: {
            weekday: string,
            hour: number
        }[]
    }
}

interface PreparedData {
    x: number
    y: number
    diff: number
    opacity: number
}

function prepareData(reference: InputData, running: InputData): PreparedData[] {
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
            Object.entries(reference).flatMap(([owner, entry]) => {
                return entry?.calendar?.map(entry => ({...entry, owner}))
            }),
            ({weekday, hour}) => `${weekday}, ${hour}`
        )
    ).map(entries => {
        return {
            weekday: dayMapping[entries !== undefined ? entries[0].weekday : ''],
            hour: entries?.[0].hour,
            resources: entries?.map(entry => entry.owner)
        }
    })

    const run = Object.values(
        Object.groupBy(
            Object.entries(running).flatMap(([owner, entry]) => {
                return entry?.calendar?.map(entry => ({...entry, owner}))
            }),
            ({weekday, hour}) => `${weekday}, ${hour}`
        )
    ).map(entries => {
        return {
            weekday: dayMapping[entries !== undefined ? entries[0].weekday : ''],
            hour: entries?.[0].hour,
            resources: entries?.map(entry => entry.owner)
        }
    })

    let minDiff = Number.MAX_SAFE_INTEGER
    let maxDiff = Number.MIN_SAFE_INTEGER

    const diff = [...(new Array(7)).keys()].map(_day => {
        return [...(new Array(24)).keys()].map(_hour => {
            const _ref = ref.find(({hour, weekday}) => hour === _hour && weekday === _day)?.resources || []
            const _run = run.find(({hour, weekday}) => hour === _hour && weekday === _day)?.resources || []

            minDiff = Math.min(minDiff, _run.length - _ref.length)
            maxDiff = Math.max(maxDiff, _run.length - _ref.length)

            return {
                diff: _run.length - _ref.length,
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

export default function CalendarPlot({title, data}: Props) {
    if (data === undefined)
        return

    const dayMapping = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

    return <details className='break-inside-avoid' open>
        <summary className='flex cursor-pointer hover:underline'>
            <h1 className='text-left text-2xl font-medium'>{title}</h1>
        </summary>
        <div className='my-4 ml-4 border-l-2 pl-4'>
            <ResponsiveContainer width='100%' height={300}>
                <ScatterChart className='fill-slate-700 stroke-slate-400 dark:fill-slate-500 dark:stroke-slate-500'>
                    <XAxis dataKey = 'time'
                           axisLine={{stroke: 'inherit'}}
                           type='number'
                           scale='linear'
                           ticks={[...(new Array(25).keys())]}
                           tick={{fontSize:'0.8rem', fill:'inherit'}}
                           domain={[0,24]}
                           height={50}
                    />
                    <YAxis dataKey = 'day'
                           type = 'number'
                           axisLine={{stroke: 'inherit'}}
                           overflow = {'none'}
                           ticks = {[...(new Array(7).keys())].map(x => x + 0.5)}
                           domain={[0,7]}
                           tick = {{fontSize: '.9rem', fill:'inherit', fontFamily: 'monospace'}}
                           tickFormatter = { value => dayMapping[Math.floor(value)].slice(0, 3) }
                           tickLine = { false }
                           interval = {0}
                           width={30}
                           includeHidden
                    />
                    <Legend verticalAlign='top'
                            iconSize={18}
                            formatter={ (value: string) => {
                                return <span className = 'text-sm font-medium text-slate-900 dark:text-slate-50'>{value}</span>
                            }}
                            payload={[
                                { value: 'Added resources', type: 'rect', color: '#22c55e'},
                                { value: 'Deleted resources', type: 'rect', color: '#ef4444'},
                            ]}
                    />
                    {
                        prepareData(data.reference as InputData, data.running as InputData).map(({x, y, diff, opacity}) => {
                            return <ReferenceArea key = {`${y}(${x}-${x + 1})`}
                                                  x1 = {x}
                                                  x2 = {x+1}
                                                  y1 = {y}
                                                  y2 = {y+1}
                                                  isFront
                                                  fillOpacity = { opacity }
                                                  fill = { 'inherit' }
                                                  className = { clsx(
                                                      diff > 0 && 'fill-green-500',
                                                      diff < 0 && 'fill-red-500',
                                                      diff === 0 && 'fill-slate-100 dark:fill-slate-800',
                                                  ) }
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
                                    { diff >= 0 ? `+${diff}` : diff }
                                </Label>
                            </ReferenceArea>
                        })
                    }
                </ScatterChart>
            </ResponsiveContainer>
        </div>
    </details>
}