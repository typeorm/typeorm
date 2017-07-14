import {JoinColumnOptions} from "./JoinColumnOptions";

/**
 * Describes all relation's options.
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

}