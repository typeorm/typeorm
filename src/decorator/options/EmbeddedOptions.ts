/**
 * Options specific to embedded column.
 *
 * todo: Rename to EmbeddedOptions
 */
export interface EmbeddedOptions {

    /**
     * Embedded column prefix.
     * If set to empty string or false, then prefix is not set at all.
     */
    prefix?: string | boolean;

    /**
     * Indicates if this embedded is an array.
     * Supported only by mongodb
     */
    array?: boolean;
}
