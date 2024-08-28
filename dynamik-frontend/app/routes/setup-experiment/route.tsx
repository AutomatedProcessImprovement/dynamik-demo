import { useEffect } from 'react'

import { useOutletContext, useNavigate, useNavigation, useSubmit } from '@remix-run/react'

import {
    ArrowsRightLeftIcon, ArrowRightIcon, AdjustmentsHorizontalIcon, ShieldCheckIcon, DocumentTextIcon
} from '@heroicons/react/24/outline'
import { clsx } from 'clsx/lite'
import { toast } from 'sonner'

import Loader from '~/components/Loader'

import type { ConfigContextType } from'~/root'
import type { AlgorithmConfiguration, LogMapping } from '~/types'

import { Stepper, Step, MappingInput, ConfigInput, Preview } from './components'

export default function SetupExperiment() {
    const {
        id, files, config, mapping, email, headers,
        setMapping, setConfig
    } = useOutletContext<ConfigContextType>()
    const submit = useSubmit()
    const navigate = useNavigate()
    const navigation = useNavigation()


    useEffect(() => {
        if (!id) {
            navigate('/', {replace: true})
        }
    }, [id, navigate])


    const isPending = navigation.state !== 'idle'

    const onMappingCompleted = (data: FormData) => {
        const _mapping: LogMapping = {
            case: data.get('case') as string,
            activity: data.get('activity') as string,
            enablement: data.get('enablement') as string,
            start: data.get('start') as string,
            end: data.get('end') as string,
            resource: data.get('resource') as string,
        }

        _mapping.attributes = Object.fromEntries(
            [...headers].filter(header => !Object.values(_mapping).includes(header)).map(header => [header, header])
        )

        setMapping(_mapping)

        // If no repeated values assigned
        if (new Set(Object.keys(_mapping)).size === new Set(Object.values(_mapping)).size) {
            return true
        } else {
            toast.error('Invalid mapping', {description: 'You assigned the same column to multiple attributes!'})
            return false
        }
    }
    const onConfigCompleted = (data: FormData) => {
        const _config: AlgorithmConfiguration = {
            window_size: data.has('window_size') ? data.get('window_size') as string : undefined,
            drift_magnitude: data.has('drift_magnitude') ? data.get('drift_magnitude') as string : undefined,
            warnings: data.has('warnings') ? data.get('warnings') as string : undefined,
        }

        setConfig(_config)

        // If any value is missing
        if (Object.values(_config).some(value => value === undefined)) {
            toast.error('Invalid configuration', {description: 'You have to set a value for every configuration parameter!'})
            return false
        } else {
            return true
        }
    }
    const onValidationCompleted = () => {
        return true
    }
    const onSubmit = () => {
        const data = new FormData()

        data.append('id', id)
        data.append('email', email)
        data.append('config', JSON.stringify(config))
        data.append('mapping', JSON.stringify(mapping))

        for (const file of files) {
            data.append('files', file)
        }

        submit(
            data,
            {
                method: 'POST',
                encType: 'multipart/form-data',
            }
        )
    }

    return <div className='w-full'>
        <Stepper onSubmit = { onSubmit } >
            <Step label='Setup the log mapping'
                  icon={<ArrowsRightLeftIcon/>}
                  onNext={onMappingCompleted}
            >
                <p className = 'mb-4 px-4 text-justify text-sm font-medium italic text-slate-400'>
                    Configure the mapping between the log attributes and the CSV file columns.
                    Only mandatory attributes need to be mapped.
                    The rest of the columns from the CSV will be considered as additional log attributes.
                </p>
                <div className = 'flex flex-col gap-2 p-4'>
                    <MappingInput field = 'case' label = 'Case ID' />
                    <MappingInput field = 'activity' label = 'Activity' />
                    <MappingInput field = 'enablement' label = 'Enablement timestamp' />
                    <MappingInput field = 'start' label = 'Start timestamp' />
                    <MappingInput field = 'end' label = 'End timestamp' />
                    <MappingInput field = 'resource' label = 'Resource' />
                </div>
            </Step>
            <Step label='Setup your experiment'
                  icon={<AdjustmentsHorizontalIcon/>}
                  onNext={onConfigCompleted}
            >
                <div className = 'flex flex-col gap-4 p-4'>
                    <ConfigInput field = 'window_size'
                                 label = 'Window size'
                                 description = 'The window size determines the amount of time represented by each of the windows.'
                                 values={['1 day', '3 days', '7 days', '15 days', '30 days']}
                    />
                    <ConfigInput field = 'drift_magnitude'
                                 label = 'Drift magnitude'
                                 description = 'The drift magnitude represents the minimum difference in time between the reference and the running windows considered as a drift.'
                                 values={['5 min', '15 min', '30 min', '1 h', '3 h', '6 h', '12 h']}
                    />
                    <ConfigInput field = 'warnings'
                                 label = 'Number of warnings'
                                 description = 'The number of warnings specifies the amount of alerts before a drift is confirmed.'
                                 values={['1', '3', '5']}
                    />
                </div>
            </Step>
            <Step label='Validate configuration'
                  icon={<ShieldCheckIcon/>}
                  onNext={onValidationCompleted}
            >
                <p className = 'mb-4 px-4 text-justify text-sm font-medium italic text-slate-400'>
                    Please, check that the files, mapping and configuration specified are correct.
                    Also, if you want to receive a notification in your email when the results are available, please introduce your address below.
                </p>
                <div className = 'flex flex-col gap-2 p-4'>
                    <div className='mb-4 grid grid-cols-3 gap-2'>
                        <Preview label='Files'>
                            <ul>
                                {
                                    files.map(file =>
                                        <li key={file.name} className='flex items-center gap-2 font-mono'>
                                            <DocumentTextIcon className='size-3'/>
                                            {file.name}
                                        </li>
                                    )
                                }
                            </ul>
                        </Preview>
                        <Preview label = 'Mapping'>
                            <table className = 'w-full font-mono'>
                                <tbody>
                                {
                                    Object.entries(mapping)
                                        .filter(([key]) => key !== 'attributes')
                                        .map(([key, value]) =>
                                            <tr key={key}>
                                                <td>{key}</td>
                                                <td className = 'px-2'>
                                                    <ArrowRightIcon className='size-3'/>
                                                </td>
                                                <td className = { clsx('text-right', value === '__DISCOVER__' && 'italic') }>
                                                    {value === '__DISCOVER__' ? 'Discover' : value as string}
                                                </td>
                                            </tr>
                                        )
                                }
                                </tbody>
                            </table>
                        </Preview>
                        <Preview label = 'Setup'>
                            <ul className='flex w-full flex-col font-mono'>
                                {
                                    Object.entries(config).map(([key, value]) =>
                                        <li key={key} className = 'flex flex-row justify-between'>
                                            <span>{key}</span>
                                            <span className = 'text-right italic text-slate-400'>{value as string}</span>
                                        </li>
                                    )
                                }
                            </ul>
                        </Preview>
                    </div>
                </div>
            </Step>
        </Stepper>
        { isPending && <Loader funny/> }
    </div>
}

export { default as action } from './action'