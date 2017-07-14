import {PrimaryGeneratedColumnType} from "../../driver/types/ColumnTypes";

/**
 * Describes all column's options.
 */
export interface PrimaryGeneratedColumnOptions {

    /**
     * Column type. Must be one of the value from the ColumnTypes class.
     */
    type?: PrimaryGeneratedColumnType;

    /**
     * Column name in the database.
     */
    name?: string;

    /**
     * Column comment. Not supported by all database types.
     */
    comment?: string;

}
