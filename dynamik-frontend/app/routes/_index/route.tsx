import { useState } from 'react'

import { Form, useNavigation, useOutletContext, useSubmit } from '@remix-run/react'

import { PlayIcon } from '@heroicons/react/24/solid'
import { v4 as uuid } from 'uuid'

import Loader from '~/components/Loader'
import { ConfigContextType } from '~/root'
import { parseHeader } from '~/utils/files'

import { File, FileInput, FilePreview } from './components'

export { default as action } from './action'

export default function Index() {
    const [files, setLocalFiles] = useState<File[]>([])
    const [preview, setPreview] = useState<File | null>(null)
    const {setFiles, setHeaders, setId} = useOutletContext<ConfigContextType>()

    const navigation = useNavigation()
    const submit = useSubmit()
    const isPending = navigation.state !== 'idle'

    const removeFile = (file: File) => {
        setLocalFiles(files.filter(_file => _file.name != file.name))
    }
    const onFormSubmit = async () => {
        const headers = new Set<string>()
        for (const file of files) {
            for (const header of await parseHeader(file)) {
                headers.add(header)
            }
        }

        setId(uuid())
        setHeaders(headers)
        setFiles(files)

        submit({}, { method: 'POST' })
    }
    const onFilesChanged = (_files: File[]) => {
        const filenames = files.map(file => file.name)
        setLocalFiles(
            [...files, ..._files.filter(file => !filenames.includes(file.name))]
        )
    }
    const onFilePreviewClose = () => setPreview(null)
    const onFilePreviewOpen = (file: File) => setPreview(file)

    return <>
        <Form className = 'flex w-full flex-col gap-8'
              onSubmit = {onFormSubmit}
        >
            <div className = 'flex aspect-video min-h-96 flex-row items-center justify-center gap-4'>
                {
                    files.length > 0 &&
                    <File disabled = {isPending}
                          file = {files[0]}
                          key = {files[0].name}
                          onOpen = {onFilePreviewOpen}
                          onRemove = {removeFile}
                    />
                }
                {
                    files.length === 0 &&
                    <FileInput maxSize = { 1024*1024*50 }
                               accepts = {{ 'text/csv': ['.csv'] }}
                               onChange = { onFilesChanged }
                    />
                }
                <FilePreview file = {preview} onClose = {onFilePreviewClose} />
                {isPending && <Loader funny/>}
            </div>
            <button className = 'flex items-center justify-center gap-2 rounded-2xl border-2 border-emerald-800 bg-emerald-600 px-8 py-2 font-bold text-green-50 disabled:border-slate-300 disabled:bg-slate-200 disabled:text-slate-300 dark:disabled:border-slate-800 dark:disabled:bg-slate-900 dark:disabled:text-slate-700'
                    disabled = { files.length === 0 || isPending }
                    type = 'submit'
            >
                Configure & Run <PlayIcon className = 'size-4'/>
            </button>
        </Form>
    </>
}