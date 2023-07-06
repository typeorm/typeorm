import { JoinColumnOptions } from "./JoinColumnOptions";
/**
 * Describes all join table with multiple column options.
 */
export interface JoinTableMultipleColumnsOptions {
    /**
     * Name of the table that will be created to store values of the both tables (join table).
     * By default is auto generated.
     */
    name?: string;
    /**
     * First column of the join table.
     */
    joinColumns?: JoinColumnOptions[];
    /**
     * Second (inverse) column of the join table.
     */
    inverseJoinColumns?: JoinColumnOptions[];
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
