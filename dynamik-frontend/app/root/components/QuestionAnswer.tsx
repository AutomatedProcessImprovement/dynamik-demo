import { ReactNode } from 'react'

import { clsx } from 'clsx/lite'

interface Props {
    question:ReactNode
    answer: ReactNode
    open?: boolean
}

export default function QuestionAnswer({question, answer, open = false}: Props) {
    return <details open = {open}>
        <summary className = 'flex cursor-pointer'>
            <h2 className = 'text-2xl font-bold'>
                {question}
            </h2>
        </summary>
        <div className = {
            clsx(
                'max-w-none',
                'mt-2', 'pl-4', 'py-4',
                'border-l-2', 'border-slate-950', 'dark:border-slate-50',
                'prose', 'prose-slate', 'dark:prose-invert',
                'text-justify',
            )
        }>
            {answer}
        </div>
    </details>
}