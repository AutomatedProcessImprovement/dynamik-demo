import { useState } from 'react'

import { Outlet } from '@remix-run/react'

import type { AlgorithmConfiguration, LogMapping } from '~/types'

export { default as Layout } from '~/root/Layout'
export { default as HydrateFallback } from '~/root/HydrateFallback'
export { default as clientLoader } from '~/root/clientLoader'
export default function App() {
    const [id, setId] = useState<string>()
    const [email, setEmail] = useState<string>()
    const [files, setFiles] = useState<File[]>([])
    const [headers, setHeaders] = useState<Set<string>>(new Set<string>())
    const [mapping, setMapping] = useState<LogMapping>({})
    const [config, setConfig] = useState<AlgorithmConfiguration>({})

    return <Outlet context={{
        id, files, headers, mapping, config, email,
        setId: (value: string) => { setId(value) } ,
        setFiles: (value: File[]) => { setFiles(value) } ,
        setHeaders: (value: Set<string>) => { setHeaders(value) } ,
        setMapping: (value: LogMapping) => { setMapping(value) } ,
        setConfig: (value: AlgorithmConfiguration) => { setConfig(value) } ,
        setEmail: (value: string) => { setEmail(value) } ,
    }}/>
}

export interface ConfigContextType {
    id: string
    files: File[]
    headers: Set<string>
    mapping: LogMapping
    config: AlgorithmConfiguration
    email: string

    setId: (value: string) => void
    setFiles: (files: File[]) => void
    setHeaders: (headers: Set<string>) => void
    setMapping: (mapping: LogMapping) => void
    setConfig: (config: AlgorithmConfiguration) => void
    setEmail: (value: string) => void
}