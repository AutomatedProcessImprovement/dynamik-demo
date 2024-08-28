import { clsx } from 'clsx/lite'

import type { DriftCause } from '~/types'

interface Props{
    title: string
    data: DriftCause | undefined
}

export default function RatePlot({title, data}: Props) {
    if (data === undefined)
        return null

    const ref = data.reference as number
    const run = data.running as number
    const percentage = ((run - ref) / ref) * 100

    return <details className='break-inside-avoid' open>
        <summary className='flex cursor-pointer hover:underline'>
            <h1 className='text-left text-2xl font-medium'>{title}</h1>
        </summary>
        <div className='my-4 ml-4 flex items-center justify-between gap-4 border-l-2 pl-4'>
            <div className='flex flex-col text-right'>
                <h2>Reference rate</h2>
                <div>
                    <p className='text-3xl font-medium'>{ref.toFixed(2)}</p>
                    <p className='text-sm'>cases/hour</p>
                </div>
            </div>
            <div className='flex flex-col text-right'>
                <h2>Current rate</h2>
                <div>
                    <p className='text-3xl font-medium'>{run.toFixed(2)}</p>
                    <p className='text-sm'>cases/hour</p>
                </div>
            </div>
            <div className='flex flex-col text-right'>
                <h2>Change</h2>
                <div className='flex flex-col text-right'>
                    <p className={
                        clsx(
                            percentage > 0 && 'text-green-500',
                            percentage < 0 && 'text-red-500',
                            'text-3xl', 'font-semibold',
                            'flex', 'items-center', 'gap-2'
                        )
                    }>
                        {percentage > 0 && '+'}{percentage.toFixed(2)}%
                    </p>

                </div>
            </div>
        </div>
    </details>
}