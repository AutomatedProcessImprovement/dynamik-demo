import {useLayoutEffect} from 'react'

import {clsx} from 'clsx/lite'

import type { DriftCause } from '~/types'

interface Props {
    title: string
    data: DriftCause[] | undefined
}

interface InputData {
    cause: string
    reference: {
        [policy: string]: {
            recall: number
            classification_accuracy: number
        }
    }
    running: {
        [policy: string]: {
            recall: number
            classification_accuracy: number
        }
    }
}

interface PreparedData {
    policy: string
    recall: {
        ref: number
        run: number
        diff: number
    }
    child: PreparedData[]
}

function prepareData(input: DriftCause[]): PreparedData[] | undefined {
    const root = input.find(cause => !cause.cause.includes('?for=')) as InputData

    if(root) {
        return Object.keys(root.reference)
            .map(policy1 => {
                const child = input.find(cause => cause.cause.includes(`?for=${policy1}`))

                return {
                    policy: policy1,
                    recall: {
                        ref: root.reference[policy1].recall,
                        run: root.running[policy1].recall,
                        diff: ((root.running[policy1].recall - root.reference[policy1].recall) / root.reference[policy1].recall) * 100,
                    },
                    child: child !== undefined
                        ? Object.keys((child as InputData)?.reference)
                            .map(policy2 => {
                                return {
                                    policy: policy2,
                                    recall: {
                                        ref: (child as InputData).reference[policy2].recall,
                                        run: (child as InputData).running[policy2].recall,
                                        diff: (((child as InputData).running[policy2].recall - (child as InputData).reference[policy2].recall) / (child as InputData).reference[policy2].recall) * 100,
                                    },
                                    child: []
                                }
                            })
                        : []
                }
            })
    }

    return
}

function Policy({policy}: { policy: string }) {
    const parts = policy.split('&&')

    return <h3 className='ml-4'>
        {
            parts.map(part =>
                <p key={part}
                   className='font-mono text-sm italic leading-4 text-slate-500'>
                    {part.replace('(', '').replace(')', '')}
                </p>
            )
        }
    </h3>
}

function Accuracy({name, metric}: { name:string, metric: { ref: number, run: number, diff: number } }) {
    return <div className='flex flex-row items-start gap-4'>
        <span className='flex h-full min-w-24 max-w-24 flex-col justify-between text-right'>
            <span className='text-sm'>Reference<br/>{name}</span>
            <span className='text-lg font-medium'>{metric.ref.toFixed(2)}</span>
        </span>
        <span className='flex h-full min-w-24 max-w-24 flex-col justify-between text-right'>
            <span className='text-sm'>Current<br/>{name}</span>
            <span className='text-lg font-medium'>{metric.run.toFixed(2)}</span>
        </span>
        <span className='flex h-full min-w-24 max-w-24 flex-col justify-between text-right'>
            <span className='text-sm'>Change</span>
            <span className={
                clsx(
                    'text-2xl', 'font-semibold', 'mt-2', 'text-right',
                    metric.diff > 0 && 'text-green-500',
                    metric.diff < 0 && 'text-red-500',
                )
            }>
                {
                    !Number.isFinite(metric.diff)
                        ? '-'
                        : `${metric.diff > 0 ? '+' : ''}${metric.diff.toFixed(2)}%`
                }
            </span>
        </span>
    </div>
}


export default function PoliciesPlot({title, data}: Props) {
    useLayoutEffect(() => {
        window.addEventListener('beforeprint', () => {
            for (const detailEl of document.querySelectorAll('details')) {
                if (detailEl.getAttribute('open') == null) {
                    detailEl.setAttribute('data-was-closed', 'true')
                }
                detailEl.setAttribute('open', '')
            }
        })

        window.addEventListener('afterprint', () => {
            for (const detailEl of document.querySelectorAll('details')) {
                if (detailEl.getAttribute('data-was-closed') != null) {
                    detailEl.removeAttribute('data-was-closed')
                    detailEl.removeAttribute('open')
                }
            }
        })
    })

    if (data === undefined)
        return

    const _data = prepareData(data)
    if (_data === undefined)
        return

    return <details open>
        <summary className='flex cursor-pointer hover:underline'>
            <h1 className='break-after-avoid-page text-left text-2xl font-medium'>{title}</h1>
        </summary>
        <ul className='my-4 ml-4 flex flex-col gap-4 border-l-2 pl-4'>
            {
                _data.sort((child1, child2) => child2.recall.diff - child1.recall.diff || child2.recall.run - child1.recall.run)
                    .map((policy: PreparedData, idx: number) => {
                        return <li key={policy.policy}>
                            <details>
                                <summary className={
                                    clsx(
                                        'flex', 'flex-row', 'justify-between', 'gap-1',
                                        'rounded-2xl', 'border-2',
                                        'px-6', 'py-4',
                                        policy.child &&
                                        policy.child.filter(_policy => Number.isFinite(_policy.recall.diff)).length > 0 &&
                                        'cursor-pointer', 'break-inside-avoid'
                                    )
                                }>
                                    <div className='flex flex-col'>
                                        <h2 className='mb-2 text-xl font-medium'>
                                            {
                                                title.toLowerCase().includes('batch')
                                                    ? `Batch creation policy ${idx + 1}:`
                                                    : `Prioritization policy ${idx + 1}:`
                                            }

                                        </h2>
                                        <Policy policy={policy.policy}/>
                                    </div>
                                    <Accuracy name='recall' metric={policy.recall}/>
                                </summary>
                                {
                                    policy.child &&
                                    policy.child.filter(_policy => Number.isFinite(_policy.recall.diff)).length > 0 &&
                                    <ul className='ml-4 mt-4 flex flex-col gap-4 border-l-2 pl-4'>
                                        {
                                            policy.child
                                                .filter(_policy => Number.isFinite(_policy.recall.diff))
                                                .sort((child1, child2) => child2.recall.diff - child1.recall.diff || child2.recall.run - child1.recall.run)
                                                .map((child: PreparedData, _idx) => {
                                                    return <li key={child.policy}
                                                               className='flex break-inside-avoid flex-row justify-between gap-1 rounded-2xl border-2 px-6 py-4'>
                                                        <div className='flex flex-col'>
                                                            <h2 className='mb-2 text-xl font-medium'>Firing policy {_idx + 1}:</h2>
                                                            <Policy policy={child.policy}/>
                                                        </div>
                                                        <Accuracy name='recall' metric={child.recall}/>
                                                    </li>
                                                })
                                        }
                                    </ul>
                                }
                            </details>
                        </li>
                    })
            }
        </ul>
    </details>
}