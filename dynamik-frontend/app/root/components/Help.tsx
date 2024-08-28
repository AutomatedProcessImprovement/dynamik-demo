import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { clsx } from 'clsx/lite'

import { QuestionAnswer, License } from './'

interface Props {
    show: boolean
    onClose: () => void
}

export default function Help({show = false, onClose = () => {}}: Props) {
    return <Dialog open={show} onClose={onClose} className = {
        clsx(
            'fixed', 'inset-0',
            'flex', 'items-center', 'justify-center',
        )
    }>
        <DialogBackdrop className = 'fixed inset-0 bg-slate-900/75' />
        <DialogPanel className = { clsx(
            'flex', 'flex-col',
            'container', 'h-[70vh]', 'overflow-hidden',
            'rounded-2xl', 'bg-slate-50', 'dark:bg-slate-950',
            'z-10'
        )}>
            <DialogTitle className='relative p-4 text-center text-lg font-black'>
                FAQ
                <button onClick = {onClose}
                        className = {
                            clsx(
                                'absolute', 'inset-y-0', 'right-4',
                                'flex', 'items-center', 'justify-center',
                                'pl-4',
                            )
                        }
                >
                    <XMarkIcon className='size-5'/>
                </button>
            </DialogTitle>
            <div className = {
                clsx(
                    'flex', 'flex-col', 'gap-4',
                    'h-[calc(100%-60px)]', 'overflow-y-auto',
                    'p-8', 'pt-4',
                )
            }>
                <QuestionAnswer question = { 'What is dynamik?' }
                                answer = {
                                    <>
                                        <p>
                                            <q className = 'font-semibold'>dynamik</q> is an algorithm for detecting and
                                            explaining drifts in the cycle time of a business process based on an event log.
                                        </p>
                                        <p>
                                            Given a log, the approach identifies consecutive time windows with statistically
                                            significant differences in cycle times. It then produces possible explanations
                                            of each of these drifts based on a decomposition of cycle time into causal factors.
                                        </p>
                                        <p>
                                            Each factor is mapped to numeric indicators computed from the set of events in
                                            a time window. Each significant difference in an indicator, before and after
                                            the detected drift, is reported as a potential cause of the drift.
                                        </p>
                                    </>
                                }
                />
                <QuestionAnswer question = { 'What is the expected log format for running dynamik?' }
                                answer = {
                                    <>
                                        <p>
                                            <q className='font-semibold'>dynamik</q> can parse activity instance logs in CSV format.
                                        </p>
                                        <p>
                                            The file is expected to have a headers row followed by a row per event.
                                        </p>
                                        <p>
                                            Also, the file is expected to contain, at least, columns for the case identifier,
                                            the activity, the start and end timestamps and the resource. If your file also
                                            has the enablement time you can use it. Otherwise, dynamik will compute it for
                                            you using the SplitMiner heuristics.
                                        </p>
                                        <p>
                                            Your log should look something similar to this:
                                        </p>
                                        <pre>
                                            <table className = 'not-prose w-full text-right'>
                                                <thead>
                                                <tr>
                                                    <th>case,</th><th>start,</th><th>end,</th><th>activity,</th><th>resource</th>
                                                </tr>
                                                </thead>
                                                <tbody>
                                                <tr><td>2182,</td><td>2023-02-24T05:28:00.843,</td><td>2023-02-24T05:28:00.843,</td><td>     START,</td><td>resource-000001</td></tr>
                                                <tr><td>2182,</td><td>2023-02-24T05:28:00.843,</td><td>2023-02-24T05:34:31.219,</td><td>Activity 1,</td><td>resource-000044</td></tr>
                                                <tr><td>2182,</td><td>2023-02-24T05:34:31.219,</td><td>2023-02-24T05:47:25.817,</td><td>Activity 2,</td><td>resource-000024</td></tr>
                                                <tr><td>2182,</td><td>2023-02-24T05:47:25.817,</td><td>2023-02-24T05:59:46.195,</td><td>Activity 3,</td><td>resource-000010</td></tr>
                                                <tr><td>2182,</td><td>2023-02-24T05:59:46.193,</td><td>2023-02-24T05:59:46.193,</td><td>       END,</td><td>resource-000001</td></tr>
                                                <tr><td>7897,</td><td>2023-03-01T08:39:42.861,</td><td>2023-03-01T08:39:42.861,</td><td>     START,</td><td>resource-000001</td></tr>
                                                <tr><td>7897,</td><td>2023-03-01T08:39:42.861,</td><td>2023-03-01T08:53:41.167,</td><td>Activity 1,</td><td>resource-000029</td></tr>
                                                <tr><td>7897,</td><td>2023-03-01T08:53:41.167,</td><td>2023-03-01T08:56:46.299,</td><td>Activity 2,</td><td>resource-000007</td></tr>
                                                <tr><td>7897,</td><td>2023-03-01T08:56:46.299,</td><td>2023-03-01T09:12:49.468,</td><td>Activity 3,</td><td>resource-000018</td></tr>
                                                <tr><td>7897,</td><td>2023-03-01T09:12:49.468,</td><td>2023-03-01T09:12:49.468,</td><td>       END,</td><td>resource-000001</td></tr>
                                                <tr><td> ...</td><td>                      ...</td><td>                     ...</td><td>        ...</td><td>            ...</td></tr>
                                                </tbody>
                                            </table>
                                        </pre>
                                    </>
                                }
                />
                <QuestionAnswer question={'Can I use dynamik without this interface?'}
                                answer={
                                    <>
                                        <p>
                                            Sure! <q className='font-semibold'>dynamik</q> is implemented as a python
                                            package publicly available on github.
                                        </p>
                                        <p>
                                            The package provides functionalities for parsing logs, finding drifts and
                                            explaining drift causes.
                                        </p>
                                        <p>
                                            Please, check <a
                                            href='https://github.com/AutomatedProcessImprovement/dynamik'>the
                                            repository</a> for more info.
                                        </p>
                                    </>
                                }
                />
                <QuestionAnswer question={'Where can I read more about dynamik?'}
                                answer={
                                    <>
                                        <p>
                                            Details about <q className='font-semibold'>dynamik</q> and the algorithm
                                            validation can be found on the following paper:
                                        </p>
                                        <blockquote>
                                            <h4>
                                                Navigating Dynamic Environments: Unraveling Performance Drifts in
                                                Business Processes from Event Data
                                            </h4>
                                            <span className='block not-italic'>
                                                Victor Gallego-Fontenla, Frederik Milani, Marlon Dumas
                                            </span>
                                            <address className='block not-italic'>
                                                University of Tartu, Tartu, Estonia
                                            </address>
                                            <span className='italic'>
                                                Business & Information Systems Engineering, x - y
                                            </span>
                                        </blockquote>
                                    </>
                                }
                />
                <QuestionAnswer question='License'
                                answer={<License/>}
                />
            </div>
        </DialogPanel>
    </Dialog>
}
