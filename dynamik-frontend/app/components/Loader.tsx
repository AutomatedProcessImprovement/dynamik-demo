import { useEffect, useState } from 'react'

import { Cog6ToothIcon } from '@heroicons/react/24/outline'
import { clsx } from 'clsx/lite'

import { pickRandom } from '~/utils/random'

interface Props {
    message?: string
    className?: string
    funny?: boolean
    cancellable ?: boolean
    onCancel ?: () => void
}

const messages = [
    'Reticulating splines...',
    'Swapping time and space...',
    'Spinning violently around the y-axis...',
    'Bending the spoon...',
    'Filtering morale...',
    'Enjoying the elevator music...',
    'Checking the gravitational constant in your locale...',
    'Following the white rabbit...',
    'Waiting for the satellite to move into position...',
    'Counting to 10^10^100...',
    'Counting backwards from Infinity...',
    'Creating time-loop inversion field...',
    'Spinning the wheel of fortune...',
    'Computing chance of success...',
    'Adjusting flux capacitor...',
    'Granting wishes...',
    'Preparing coffee...',
    'Dividing by zero...',
    'Cracking military-grade encryption...',
    'Simulating traveling salesman problem...',
    'Proving P=NP...',
    'Ordering 1s and 0s...',
    'Checking the manual...',
    'Reading Terms and Conditions...',
    'Reversing the shield polarity...',
    'Disrupting warp fields with an inverse graviton burst...',
]

export default function Loader({ cancellable = false, funny = false, onCancel = () => {}, className = '', message: defaultMessage }: Props) {
    const [message, setMessage] = useState(
        defaultMessage || pickRandom(messages, 1)[0]
    )

    useEffect(() => {
        if(funny) {
            const id = setInterval(() => setMessage(pickRandom(messages, 1)[1]), 5000)
            return () => clearInterval(id)
        }
    }, [funny])

    return <div className = {
        clsx(
            'fixed', 'inset-0', 'z-[999]',
            'flex', 'flex-col', 'justify-center', 'items-center',
            'bg-slate-950/75',
            className
        )
    }
    >
        <div className='mb-24 text-white'>
            <Cog6ToothIcon className='-ml-8 size-16 animate-spin stroke-1'/>
            <Cog6ToothIcon className='-mt-6 ml-3 size-12 animate-spin stroke-1'/>
            <Cog6ToothIcon className='-mt-20 ml-6 size-10 animate-spin stroke-1'/>
        </div>

        <p className='animate-pulse font-semibold text-white'>{message || defaultMessage}</p>
        {
            cancellable &&
            <button type='button'
                    className='mt-8 rounded bg-red-500 px-4 py-1 font-semibold text-red-50'
                    onClick={onCancel}>
                Abort
            </button>
        }
    </div>
}

