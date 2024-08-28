import { useState } from 'react'

import { useOutletContext } from '@remix-run/react'

import { Field, Label, Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react'
import { CommandLineIcon } from '@heroicons/react/20/solid'
import { CheckIcon, ChevronDownIcon } from '@heroicons/react/24/outline'
import levenshtein from 'js-levenshtein'

import { ConfigContextType } from '~/root'

function findOptimalMatch(field: string, headers:string[]) {
    const distances = [...headers].map(_header => [_header, levenshtein(_header, field)])
        .toSorted(([, d1], [, d2]) => (d1 as number) - (d2 as number))
    const minDistance = Math.min(...distances.map(([, d]) => d as number))
    const options = distances.filter(([, d]) => d === minDistance).map(([header]) => header as string)
    const withSubstring = options.filter(header => header.includes(field) || field.includes(header))

    if (options.length === 1) return options[0]
    if (withSubstring.length > 0) return withSubstring[0]
    return options[0]
}

interface Props {
    field: string,
    label: string
}

export default function MappingInput({field, label}: Props) {
    const {headers, mapping} = useOutletContext<ConfigContextType>()
    const [value, setValue] = useState(
        mapping[field] || findOptimalMatch(field, [...headers])
    )
    const [isValid, setIsValid] = useState(
        Object.values(mapping).filter(value => value == mapping[field]).length <= 1
    )

    return <Field className = 'flex h-8 flex-row items-center justify-between'>
        <Label>{ label }</Label>
        <Listbox name={field}
                 value={value}
                 onChange={_value => {
                     setIsValid(true)
                     setValue(_value)
                 }}
                 invalid={!isValid}>
            <ListboxButton className = {
                `
                    group flex w-1/2 flex-row items-center justify-between rounded-2xl bg-white px-4 
                    py-1 text-left
                    data-[invalid]:border-2 
                    data-[invalid]:border-red-500  data-[open]:bg-slate-200 
                    dark:bg-gray-700
                    dark:data-[open]:bg-gray-800
                `
            }>
                <span className = {value === '__DISCOVER__' ? 'italic' : ''} >{value === '__DISCOVER__' ? 'Discover from log' : value as string}</span>
                <ChevronDownIcon className='size-4 text-slate-500 group-data-[open]:rotate-180'/>
            </ListboxButton>
            <ListboxOptions anchor='bottom' className='mt-1 flex w-[var(--button-width)] flex-col gap-1 rounded-2xl bg-white p-1 shadow dark:bg-gray-700'>
                {
                    field === 'enablement' &&
                    <>
                        <ListboxOption className = 'group flex cursor-pointer items-center justify-between overflow-hidden rounded-2xl px-4 py-1 hover:bg-slate-200 data-[selected]:bg-slate-300 data-[selected]:font-semibold dark:hover:bg-gray-600 dark:data-[selected]:bg-gray-800'
                                       value = '__DISCOVER__'>
                            <span className = 'flex flex-row items-center gap-2 italic'>
                                <CommandLineIcon className = 'size-4 stroke-1'/>
                                Discover from log
                            </span>
                            <CheckIcon className = 'hidden size-4 group-data-[selected]:inline'/>
                        </ListboxOption>
                        <hr className = '-mx-1 border-slate-200 dark:border-slate-500' />
                    </>
                }
                {
                    [...headers].map((header: string) =>
                        <ListboxOption className = 'group flex cursor-pointer items-center justify-between overflow-hidden rounded-2xl bg-white px-4 py-1 hover:bg-slate-200 data-[selected]:bg-slate-300 data-[selected]:font-semibold dark:bg-gray-700 dark:hover:bg-gray-600 dark:data-[selected]:bg-gray-800'
                                       key = {`${field}.${header}`}
                                       value = {header}>
                            {header}
                            <CheckIcon className='hidden size-4 group-data-[selected]:inline'/>
                        </ListboxOption>
                    )
                }
            </ListboxOptions>
        </Listbox>
    </Field>
}