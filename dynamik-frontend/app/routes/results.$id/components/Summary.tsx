import { Link } from '@remix-run/react'

import { CalendarDaysIcon } from '@heroicons/react/16/solid'
import { ArrowDownTrayIcon, ArrowPathIcon, ClockIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { clsx } from 'clsx/lite'
import { format, parseISO, formatDistanceToNow } from 'date-fns'

import type { AlgorithmConfiguration } from '~/types'

interface Props {
    drifts: object[]
    status: {
        status: string,
        progress: number,
        currentRef: string[],
        currentRun: string[]
    }
    lastUpdateDate: string
    submissionDate: string
    startDate?: string
    config: AlgorithmConfiguration
}

export default function Summary({drifts, status, lastUpdateDate, submissionDate, config}: Props) {
    return <div className = {
        clsx(
            'rounded-2xl', 'p-6', 'py-4',
            status.status === 'failed' ? 'bg-red-800' : 'bg-slate-950',
            status.status === 'failed' ? 'text-red-50' : 'text-slate-50',
            'dark:ring-2', 'dark:ring-slate-50'
        )
    }>
        <header className = 'mb-4 flex flex-row items-start justify-between'>
            <div>
                <h1 className='text-2xl font-semibold'>Experiment summary</h1>
                <span className={
                    clsx(
                        'flex', 'flex-row', 'items-center', 'gap-1',
                        'ml-2', 'mt-2',
                        'text-xs', 'font-medium',
                        status.status === 'failed' ? 'text-red-400' : 'text-slate-400'
                    )
                }>
                    <CalendarDaysIcon className='size-3 stroke-1'/>
                    Submitted { formatDistanceToNow(parseISO(submissionDate)) } ago.
                </span>
                {
                    status.status === 'finished' &&
                    <span className='ml-2 flex flex-row items-center gap-1 text-xs font-medium text-slate-400'>
                        <CalendarDaysIcon className='size-3 stroke-1'/>
                        Finished { formatDistanceToNow(parseISO(lastUpdateDate)) } ago.
                    </span>
                }
            </div>
            {
                status.status === 'queued' &&
                <span className='flex animate-pulse flex-row items-center gap-2 text-sm uppercase text-slate-400'>
                    <ClockIcon className='size-4 animate-spin stroke-1'/>
                    Queued
                </span>
            }
            {
                status.status === 'failed' &&
                <span className='flex flex-row items-center gap-2 text-sm uppercase text-red-400'>
                    <ExclamationTriangleIcon className='size-4 stroke-1'/>
                    Failed
                </span>
            }
            {
                status.status === 'running' &&
                <span className='flex animate-pulse flex-row items-end gap-2 text-sm uppercase text-slate-400'>
                    <ArrowPathIcon className='size-4 animate-spin stroke-1'/>
                    Running
                </span>
            }
            {
                status.status === 'finished' &&
                <Link
                    className='flex flex-row items-center gap-2 text-sm uppercase text-slate-400 underline-offset-2 hover:underline'
                    to='download'
                    reloadDocument
                >
                    <ArrowDownTrayIcon className='size-4'/>
                    Download
                </Link>
            }
        </header>
        <div className = 'flex flex-row items-center justify-between'>
            <table className = 'ml-16 text-sm'>
                <tbody>
                <tr>
                    <th className = 'text-left'>Window size</th>
                    <td className = 'pl-4 text-right'>{config.window_size}</td>
                </tr>
                <tr>
                    <th className = 'text-left'>Drift magnitude</th>
                    <td className = 'pl-4 text-right'>{config.drift_magnitude}</td>
                </tr>
                <tr>
                    <th className = 'text-left'>Warnings</th>
                    <td className = 'pl-4 text-right'>{config.warnings}</td>
                </tr>
                </tbody>
            </table>
            <p className='flex flex-row gap-2'>
                <span className='text-7xl font-semibold'>{status.status !== 'queued' ? drifts.length : '-'}</span>
                <span className = 'flex flex-col pt-2'>
                    <span className = 'text-right leading-none'>drifts</span>
                    <span className = 'text-right leading-none'>found</span>
                </span>
            </p>
        </div>
        {
            status.status === 'running' &&
            <>
                <div className='relative mb-2'>
                    <div className='mt-4 h-4 w-full overflow-hidden rounded-2xl border-2 border-slate-50 bg-slate-50'>
                        <span className={`block h-full rounded-2xl bg-slate-950`}
                              style={{
                                  width: `${status.progress}%`
                              }}
                        />
                    </div>
                    <span className={`absolute top-0 animate-spin rounded-full bg-slate-950 ring-2 ring-slate-50`}
                          style={{
                              left: `max(0px, calc(${status.progress}% - 1rem))`
                          }}
                    >
                        <ArrowPathIcon className='size-4 stroke-2 p-0.5'/>
                    </span>
                </div>
                <div className = 'flex flex-row items-center justify-between'>
                    <span>
                        <h3 className = 'text-xs'>Current reference window</h3>
                        <p className = 'text-sm font-medium'>
                            {format(parseISO(status.currentRef[0]), 'dd/MM/yyyy')} - {format(parseISO(status.currentRef[1]), 'dd/MM/yyyy')}
                        </p>
                    </span>
                    <span>
                        <h3 className = 'text-xs'>Current running window</h3>
                        <p className = 'text-sm font-medium'>
                            {format(parseISO(status.currentRun[0]), 'dd/MM/yyyy')} - {format(parseISO(status.currentRun[1]), 'dd/MM/yyyy')}
                        </p>
                    </span>
                </div>
            </>
        }
        {
            status.status === 'queued' &&
            <div className='mt-4 h-4 overflow-hidden rounded-2xl border-2 border-slate-50 bg-slate-50'>
                <span className='block size-full animate-pulse rounded-2xl bg-slate-400'/>
            </div>
        }
    </div>
}
