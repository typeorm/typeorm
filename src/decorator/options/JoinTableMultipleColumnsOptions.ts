import { JoinColumnOptions } from "./JoinColumnOptions"

/**
 * Describes all join table with multiple column options.
 */
export interface JoinTableMultipleColumnsOptions {
    /**
     * Name of the table that will be created to store values of the both tables (join table).
     * By default is auto generated.
     */
    name?: string

    /**
     * First column of the join table.
     */
    joinColumns?: JoinColumnOptions[]

    /**
     * Second (inverse) column of the join table.
     */
    inverseJoinColumns?: JoinColumnOptions[]

    /**
     * Database where join table will be created.
     * Works only in some databases (like mysql and mssql).
     */
    database?: string

    /**
     * Schema where join table will be created.
     * Works only in some databases (like postgres and mssql).
     */
    schema?: string

    /**
     * Indicates if schema synchronization is enabled or disabled junction table.
     * If it will be set to false then schema sync will and migrations ignores junction table.
     * By default schema synchronization is enabled.
     */
    readonly synchronize?: boolean

    /**
     * Allows shared columns between joinColumns and inverseJoinColumns in junction table.
     * When set to true, TypeORM will not rename duplicate column names (e.g., id_1).
     * This is useful for partitioned junction tables where both entities share the same partition keys.
     * By default is false.
     */
    preserveSharedColumns?: boolean
}
