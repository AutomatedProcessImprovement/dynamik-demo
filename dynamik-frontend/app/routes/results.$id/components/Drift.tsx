import { Link } from '@remix-run/react'

import { ArrowDownTrayIcon, EyeIcon } from '@heroicons/react/24/outline'
import { format, parseISO } from 'date-fns'

interface Props {
    drift: {
        index: number,
        referenceWindow: string[],
        runningWindow: string[],
        description: string
    }
}

export default function Drift({drift}: Props) {
    return <li>
        <details open>
            <summary className='flex cursor-pointer flex-row items-end justify-between gap-2 border-b-2 border-transparent hover:border-slate-700'>
                <h2 className='text-nowrap text-2xl font-black'>
                    Drift {drift.index + 1}
                </h2>
                <span className='text-right text-base font-medium text-slate-400'>
                    between ({format(parseISO(drift.referenceWindow[0]), 'dd/MM/yyyy')} - {format(parseISO(drift.referenceWindow[1]), 'dd/MM/yyyy')}) and ({format(parseISO(drift.runningWindow[0]), 'dd/MM/yyyy')} - {format(parseISO(drift.runningWindow[1]), 'dd/MM/yyyy')})
                </span>
            </summary>
            <div className='relative my-2 ml-2 flex flex-col gap-2 border-l-2 border-slate-400'>
                <p className='prose w-full max-w-full pl-64 text-justify font-medium leading-none text-slate-500'>
                    {drift.description}
                </p>
                <menu className='flex flex-row justify-end gap-4'>
                    <li>
                        <Link
                            className='flex flex-row items-center gap-2 text-sm font-medium underline-offset-2 hover:underline'
                            to={`${drift.index}/download`}
                            reloadDocument
                        >
                            <ArrowDownTrayIcon className='size-3'/>
                            Download JSON
                        </Link>
                    </li>
                    <li>
                        <Link
                            className='flex flex-row items-center gap-2 text-sm font-medium underline-offset-2 hover:underline'
                            to={`${drift.index}`}
                        >
                            <EyeIcon className='size-3'/>
                            View details
                        </Link>
                    </li>
                </menu>
            </div>
        </details>
    </li>
}
