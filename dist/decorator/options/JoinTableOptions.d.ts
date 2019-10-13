import { JoinColumnOptions } from "./JoinColumnOptions";
/**
 * Describes join table options.
 */
export interface JoinTableOptions {
    /**
     * Name of the table that will be created to store values of the both tables (join table).
     * By default is auto generated.
     */
    name?: string;
    /**
     * First column of the join table.
     */
    joinColumn?: JoinColumnOptions;
    /**
     * Second (inverse) column of the join table.
     */
    inverseJoinColumn?: JoinColumnOptions;
    /**
     * Database where join table will be created.
     * Works only in some databases (like mysql and mssql).
     */
    database?: string;
    /**
     * Schema where join table will be created.
     * Works only in some databases (like postgres and mssql).
     */
    schema?: string;
}
