/**
 * Special options passed to Repository#persist method.
 */
export interface SaveOptions {

    /**
     * Additional data to be passed with persist method.
     * This data can be used in subscribers then.
     */
    data?: any;

}