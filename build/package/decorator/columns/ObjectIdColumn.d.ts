import { ColumnOptions } from "../../";
/**
 * Special type of column that is available only for MongoDB database.
 * Marks your entity's column to be an object id.
 */
export declare function ObjectIdColumn(options?: ColumnOptions): PropertyDecorator;
