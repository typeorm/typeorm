/**
 * Special options passed to Repository#remove method.
 */
export interface RemoveOptions {

    /**
     * Additional data to be passed with remove method.
     * This data can be used in subscribers then.
     */
    data?: any;

    /**
     * Flag to determine whether the entity that is being persisted
     * should be reloaded during the persistence operation
     */
    reloadEntity?: boolean;
}
