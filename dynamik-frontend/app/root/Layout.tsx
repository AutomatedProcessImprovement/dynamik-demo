import { ReactNode, useEffect, useState } from 'react'

import { Link, Links, Meta, Scripts, ScrollRestoration } from '@remix-run/react'

import {
    CheckBadgeIcon,
    ClockIcon,
    ExclamationCircleIcon,
    ExclamationTriangleIcon,
    InformationCircleIcon
} from '@heroicons/react/16/solid'
import { PresentationChartBarIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline'
import { clsx } from 'clsx/lite'
import { Toaster } from 'sonner'

import '~/tailwind.css'

import { Help, ThemeSelector } from './components'
import logo from './logo.svg'

export default function Layout({ children }: { children: ReactNode }) {
    const [theme, setTheme] = useState('light')
    const [showHelp, setShowHelp] = useState(false)

    useEffect(() => {
        const system = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
        const user = localStorage.getItem('theme') || 'light'

        setTheme(previous => user || system || previous)
    }, [theme])

    return <html lang='en' className={theme}>
    <head>
        <title>dynamik - process performance drift detector</title>
        <meta charSet='utf-8' />
        <meta name='viewport' content='width=device-width, initial-scale=1' />
        <link rel='icon' href={logo} />
        <link rel='mask-icon' href={logo} color='#FFF' />
        <Meta/>
        <Links/>
    </head>

    <body className = {
        clsx(
            'relative',
            'h-screen', 'w-full',
            'bg-slate-50', 'text-slate-950',
            'dark:bg-slate-950', 'dark:text-slate-50',
            'select-none',
        )
    }>
    <div className = {
        clsx(

            'absolute', 'inset-0',
            'flex', 'flex-col', 'justify-between', 'gap-4',
            'container', 'max-w-screen-lg', 'h-full', 'mx-auto', 'p-4',
        )
    }>
        <header className={
            clsx(
                'flex', 'items-center', 'justify-between',
                'print:justify-start',
                'w-full',
                'print:mb-16',
            )
        }>
            <button className = 'w-16 print:hidden' onClick = { () => setShowHelp(true)}>
                <QuestionMarkCircleIcon className='size-6 stroke-2'/>
            </button>
            <Link to='/'
                  reloadDocument
                  className={
                      clsx(
                          'flex', 'flex-row', 'items-center', 'justify-center', 'gap-4',
                          'font-display', 'text-4xl',
                      )
                  }
            >
                <PresentationChartBarIcon className='size-8 stroke-2'/>
                <h1>dynamik.</h1>
            </Link>
            <ThemeSelector theme = { theme }
                           onChange = {
                               value => setTheme(() => {
                                   localStorage.setItem('theme', value)
                                   return value
                               })
                           }
            />
        </header>
        <main className = 'flex w-full flex-1 flex-col items-center justify-center gap-4' >
            {children}
        </main>
        <footer className = 'w-full text-center font-sans font-medium print:hidden'>
            © 2024 Software Engineering & Information Systems Group, University of Tartu
        </footer>
    </div>
    <aside className='absolute bottom-0 right-0'>
        <Toaster offset={16}
                 gap={8}
                 visibleToasts={100}
                 duration={5000}
                 closeButton
                 icons={{
                     success: <CheckBadgeIcon className='size-4 text-green-500'/>,
                     info: <InformationCircleIcon className='size-4 text-blue-500'/>,
                     warning: <ExclamationTriangleIcon className='size-4 text-amber-500'/>,
                     error: <ExclamationCircleIcon className='size-4 text-red-500'/>,
                     loading: <ClockIcon className='size-4 text-slate-500'/>,
                 }}
                 toastOptions={{
                     classNames: {
                         title: 'font-bold',
                         description: 'text-xs text-slate-500',
                         closeButton: 'bg-white border',
                     },
                 }}
        />
    </aside>
    <Help show = {showHelp} onClose = { () => setShowHelp(false) } />
    <ScrollRestoration/>
    <Scripts/>
    </body>
    </html>
}
