/**
 * Column options specific to embedded column.
 */
export interface ColumnEmbeddedOptions {

    /**
     * Embedded column prefix.
     * If set to empty string or false, then prefix is not set at all.
     */
    prefix?: string | boolean;

    /**
     * A factory function that will be used to map a raw TypeORM object into the entity,
     * instead of trying to use public setters. Useful for some object-oriented patterns.
     * @see https://github.com/typeorm/typeorm/issues/6993
     */
    domainEntityMapper?: Function;

}
