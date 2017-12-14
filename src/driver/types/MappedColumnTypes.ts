import {ColumnType} from "./ColumnTypes";

/**
 * Orm has special columns and we need to know what database column types should be for those types.
 * Column types are driver dependant.
 */
export interface MappedColumnTypes {

    /**
     * Column type for the create date column.
     */
    createDate: ColumnType;

    /**
     * Precision of datetime column. Used in MySql to define milliseconds.
     */
    createDatePrecision?: number;

    /**
     * Default value should be used by a database for "created date" column.
     */
    createDateDefault: string;

    /**
     * Column type for the update date column.
     */
    updateDate: ColumnType;

    /**
     * Precision of datetime column. Used in MySql to define milliseconds.
     */
    updateDatePrecision?: number;

    /**
     * Default value should be used by a database for "updated date" column.
     */
    updateDateDefault: string;

    /**
     * Default value should be used by a databse for "deleted date" column.
     */
    softDeleteDate: ColumnType;

    /**
     * Precision of datetime column. Used in MySql to define milliseconds.
     */
    softDeleteDatePrecision?: number;

    /**
     * Column type for the version column.
     */
    version: ColumnType;

    /**
     * Column type for the tree level column.
     */
    treeLevel: ColumnType;

    /**
     * Column type of timestamp column used for migrations table.
     */
    migrationTimestamp: ColumnType;

    /**
     * Column type for migration name column used for migrations table.
     */
    migrationName: ColumnType;

    /**
     * Column type for identifier column in query result cache table.
     */
    cacheId: ColumnType;

    /**
     * Column type for identifier column in query result cache table.
     */
    cacheIdentifier: ColumnType;

    /**
     * Column type for time column in query result cache table.
     */
    cacheTime: ColumnType;

    /**
     * Column type for duration column in query result cache table.
     */
    cacheDuration: ColumnType;

    /**
     * Column type for query column in query result cache table.
     */
    cacheQuery: ColumnType;

    /**
     * Column type for result column in query result cache table.
     */
    cacheResult: ColumnType;

}
