/**
 * Customize temporal tables
 */
export interface VersioningOptions {
    columnFrom?: string

    columnTo?: string

    dataConsistencyCheck?: boolean

    historyTable?: string
}
