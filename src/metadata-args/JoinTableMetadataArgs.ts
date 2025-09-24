import { JoinColumnMetadataArgs } from "./JoinColumnMetadataArgs"

/**
 * Arguments for JoinTableMetadata class.
 */
export interface JoinTableMetadataArgs {
    /**
     * Class to which this column is applied.
     */
    readonly target: Function | string

    /**
     * Class's property name to which this column is applied.
     */
    readonly propertyName: string

    /**
     * Name of the table that will be created to store values of the both tables (join table).
     * By default is auto generated.
     */
    readonly name?: string

    /**
     * First column of the join table.
     */
    readonly joinColumns?: JoinColumnMetadataArgs[]

    /**
     * Second (inverse) column of the join table.
     */
    readonly inverseJoinColumns?: JoinColumnMetadataArgs[]

    /**
     * Database where join table will be created.
     * Works only in some databases (like mysql and mssql).
     */
    readonly database?: string

    /**
     * Schema where join table will be created.
     * Works only in some databases (like postgres and mssql).
     */
    readonly schema?: string

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
    readonly preserveSharedColumns?: boolean
}
