/**
 * Customize temporal tables options
 */
export interface VersioningOptions {
    /*
     * The system records the start time for the row in this column.
     */
    validFrom?: string

    /*
     * The system records the end time for the row in this column.
     */
    validTo?: string

    /*
     * When creating a link to an existing history table, you can choose to perform a data consistency check.
     * This data consistency check ensures that existing records don't overlap and that temporal requirements
     * are fulfilled for every individual record. Performing the data consistency check is the default.
     */
    dataConsistencyCheck?: boolean

    /*
     * The system uses the history table to automatically store the previous version of the row each time a
     * row in the temporal table gets updated or deleted.
     */
    historyTable?: string
}
