import { cloneElement, ReactElement, ReactNode } from 'react'

import { ExclamationCircleIcon } from '@heroicons/react/16/solid'
import { clsx } from 'clsx/lite'

interface Props {
    label: string
    icon?: ReactElement
    children?: ReactNode
    onNext?: (data: FormData) => boolean
}

interface InternalProps {
    active?: boolean
    valid?: boolean
    form?: string
    idx?: number
}

export default function Step({label, active, valid, icon, form, idx}: Props & InternalProps) {
    return <li className='relative'>
        <button form = {form}
                formAction = {`action:go?step=${idx}`}
                type = 'submit'
                className={
                    clsx(
                        'flex', 'flex-col', 'justify-center', 'items-center', 'gap-2',
                        'p-2',
                        'cursor-pointer',
                        active && 'font-semibold',
                        !active && 'text-slate-400'
                    )
                }
        >
            {
                icon &&
                cloneElement(icon, {className: `size-6 ${icon.props.className}`})
            }
            <span className='text-center text-xs'>{label}</span>
        </button>
        {
            valid === false &&
            <span className='absolute right-14 top-0'>
                <ExclamationCircleIcon className='absolute size-4 animate-ping rounded-full bg-red-500 text-red-500'/>
                <ExclamationCircleIcon className='absolute size-4 text-red-500' />
            </span>
        }
    </li>
}
