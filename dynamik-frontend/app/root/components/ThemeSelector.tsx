import {Switch} from '@headlessui/react'
import {MoonIcon, SunIcon} from '@heroicons/react/24/outline'
import {clsx} from 'clsx/lite'

interface Props {
    theme: string
    onChange: (value: string) => void
}

export default function ThemeSelector({theme, onChange}: Props) {
    return <Switch className = {
                        clsx(
                            'relative',
                            'w-16', 'h-8',
                            'rounded-full', 'border-2', 'border-slate-950',
                            'data-[checked]:border-slate-50',
                            'print:hidden',
                            'group',
                        )
                   }
                   checked = { theme === 'dark' }
                   onChange = { value => onChange(value ? 'dark' : 'light') }
    >
                    <span className = {
                        clsx(
                            'absolute', 'inset-0',
                            'flex', 'items-center', 'justify-between',
                            'pl-1', 'pr-2',
                            'text-sm', 'font-bold', 'text-slate-950',
                            'group-data-[checked]:opacity-0',
                        )
                    }>
                        <SunIcon className='size-6'/>
                        on
                    </span>
                    <span className = {
                        clsx(
                            'absolute', 'inset-0',
                            'flex', 'items-center', 'justify-between',
                            'pl-2', 'pr-1',
                            'text-sm', 'font-bold', 'text-slate-50', 'opacity-0',
                            'group-data-[checked]:opacity-100',
                        )
                    }>
                        off
                        <MoonIcon className='size-6'/>
                    </span>
    </Switch>
}