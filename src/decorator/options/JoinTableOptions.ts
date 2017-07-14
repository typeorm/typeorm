import {JoinColumnOptions} from "./JoinColumnOptions";

/**
 * Describes all relation's options.
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

}