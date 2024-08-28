import { Children, cloneElement, ReactElement, SyntheticEvent, useId, useState } from 'react'

import { Form } from '@remix-run/react'

import { ArrowLeftIcon, ArrowLongRightIcon, ArrowRightIcon } from '@heroicons/react/24/outline'
import { PlayCircleIcon } from '@heroicons/react/24/solid'
import { clsx } from 'clsx/lite'
import { toast } from 'sonner'

interface Props {
    children: ReactElement[]
    onSubmit: () => void
    className?: string
}

export default function Stepper({children = [], onSubmit = () => {}, className = ''}: Props) {
    const count = Children.count(children)
    const steps = Children.map(children, child =>
        <>
            {child.props.children}
        </>
    )
    const headers = Children.map(children, child => child.props.label)

    const onNextHandlers = Children.map(children, child =>
        child.props.onNext ? child.props.onNext : () => true
    )

    const [activeStep, setActiveStep] = useState(0)
    const [validity, setValidity] = useState(steps.map(() => undefined))
    const id = useId()

    const submit = (evt: SyntheticEvent<HTMLFormElement, SubmitEvent>) => {
        evt.preventDefault()
        const action = new URL((evt.nativeEvent.submitter as HTMLButtonElement).formAction)
        const data = new FormData(evt.currentTarget)

        if (activeStep <= count) {
            validity[activeStep] = onNextHandlers[activeStep]?.(data)
            setValidity(validity)
        }

        switch(action.pathname) {
            case 'go':
                setActiveStep(Number.parseInt(action.searchParams.get('step') as string))
                break
            case 'next':
                setActiveStep(previous => previous + 1)
                if (activeStep === count - 1) {
                    setActiveStep(previous => previous - 1)

                    if (validity.every(value => value !== false)) {
                        onSubmit()
                    } else {
                        toast.error(
                            'Error on form submission!',
                            {description: 'Please fix the errors in the form before submitting'}
                        )
                    }
                }
                break
            case 'prev':
                setActiveStep(activeStep - 1)
                break
        }
    }

    return <div className='flex flex-col gap-4'>
        <ol className='mb-4 flex flex-row items-center justify-between gap-12'>
            {
                Children.map(children, (child, idx) =>
                    <>
                        {
                            cloneElement(child, {
                                active: idx === activeStep,
                                valid: validity[idx],
                                form: id,
                                idx: idx
                            })
                        }
                        {
                            (idx < count - 1) &&
                            <li className = 'size-6 text-slate-300 dark:text-slate-700'>
                                <ArrowLongRightIcon />
                            </li>
                        }
                    </>
                )
            }
        </ol>
        <Form id={id}
              className = {
                  clsx(
                      'w-full', 'min-h-96', 'overflow-hidden',
                      'rounded-2xl', 'border-2', 'border-slate-300', 'dark:border-slate-700',
                      'bg-slate-100', 'dark:bg-slate-900',
                      className
                  )
              }
              onSubmit={submit}
        >
            <h1 className='p-4 text-center font-semibold'>{headers[activeStep]}</h1>
            {steps[activeStep]}
        </Form>
        <nav className={
            clsx(
                'flex',
                activeStep === 0 && 'justify-end',
                activeStep !== 0 && 'justify-between',
                'w-full',
            )
        }>
            {
                activeStep !== 0 &&
                <button className = 'flex items-center gap-2 p-2 px-4'
                        type = 'submit'
                        form = {id}
                        formAction = 'action:prev'
                >
                    <ArrowLeftIcon className='size-4'/>
                    Previous
                </button>
            }
            {
                activeStep < count - 1 &&
                <button className = 'flex items-center gap-2 p-2 px-4'
                        type = 'submit'
                        form = {id}
                        formAction = 'action:next'
                >
                    Next
                    <ArrowRightIcon className='size-4'/>
                </button>
            }
            {
                activeStep === count - 1 &&
                <button className = {
                    clsx(
                        'flex', 'items-center', 'gap-2',
                        'p-2', 'px-4',
                        'rounded-2xl', 'border-2', 'border-slate-300', 'enabled:border-green-700',
                        'bg-green-600', 'disabled:bg-slate-100',
                        'font-semibold', 'text-green-50', 'disabled:text-slate-300',
                    )
                }
                        type = 'submit'
                        form = {id}
                        formAction = 'action:next'
                >
                    <PlayCircleIcon className='size-4' />
                    Run
                </button>
            }
        </nav>
    </div>
}