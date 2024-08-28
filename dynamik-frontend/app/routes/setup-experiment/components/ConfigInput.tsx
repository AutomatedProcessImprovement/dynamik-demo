import { useState } from 'react'

import { useOutletContext } from '@remix-run/react'

import { Description, Field, Label, Radio, RadioGroup } from '@headlessui/react'

import { ConfigContextType } from '~/root'

interface Props {
    field: string
    label: string
    description: string
    values: string[]
}

export default function ConfigInput({field, label, description, values}: Props) {
    const {config} = useOutletContext<ConfigContextType>()
    const [value, setValue] = useState(
        config[field] || null
    )

    return <Field>
        <Label>{label}</Label>
        <Description className='px-4 py-2 text-justify text-sm font-medium italic text-slate-400'>
            {description}
        </Description>
        <RadioGroup name = { field }
                    value = { value }
                    onChange = { setValue }
                    className = 'flex flex-row divide-x-2 divide-slate-100 overflow-hidden rounded-2xl bg-white dark:divide-slate-800 dark:bg-gray-700'>
            {
                values.map((value, idx) =>
                    <Field key={idx} className='flex-1'>
                        <Radio
                            value = {value}
                            className = 'block w-full cursor-pointer p-2 text-center hover:bg-slate-200 data-[checked]:bg-slate-300 data-[checked]:font-semibold dark:hover:bg-gray-600 dark:data-[checked]:bg-gray-900'
                        >
                            <span>{value}</span>
                        </Radio>
                    </Field>
                )
            }
        </RadioGroup>
    </Field>
}