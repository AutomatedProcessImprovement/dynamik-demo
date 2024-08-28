export interface Experiment {
    logs?: string[]
    id: string
    email: string
    submitted: string
    config: AlgorithmConfiguration,
    mapping: LogMapping
}

export interface AlgorithmConfiguration {
    [key: string]: string | undefined | object
    window_size ?: string
    drift_magnitude ?: string
    warnings ?: string
}

export interface LogMapping {
    [key: string]: string | undefined | object
    case?: string
    activity?: string
    enablement?: string
    start?: string
    end?: string
    resource?: string
    attributes?: {
        [key: string]: string
    }
}

export interface ExecutionStatus {
    status: {
        status: 'queued' | 'running' | 'finished'
        progress: number,
        currentRef: [string, string]
        currentRun: [string, string]
    },
    startDate?: string
    lastUpdateDate: string
    drifts: DriftOverview[],
}

export interface DriftOverview {
    index: number
    experiment: string
    description: string
    referenceWindow: [string, string]
    runningWindow: [string, string]
}

export interface DriftDetails extends DriftOverview{
    causes: DriftCause[]
}

export interface DriftCause {
    cause: string
    reference: unknown
    running: unknown
}