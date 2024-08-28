import { ReactNode } from 'react'

import { clsx } from 'clsx/lite'

interface Props {
    label: ReactNode,
    children: ReactNode,
}

export default function Preview({label, children}: Props) {
    return <div className = {
        clsx(
            'relative',
            'flex-1 ', 'p-4',
            'rounded-2xl', 'border', 'border-slate-300', 'dark:border-slate-700',
            'bg-slate-100', 'dark:bg-slate-900'
        )
    }>
        <h3 className='absolute -top-4 bg-slate-100 px-2 dark:bg-slate-900'>{ label }</h3>
        { children }
    </div>
}