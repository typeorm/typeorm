/**
 * Special options passed to Repository#persist method.
 */
export interface SaveOptions {

    /**
     * Additional data to be passed with persist method.
     * This data can be used in subscribers then.
     */
    data?: any;

    /**
     * Flag to determine whether the entity that is being persisted
     * should be reloaded during the persistence operation
     */
    reloadEntity?: boolean;
}
