import { ColumnOptions, ColumnType } from "../../";
/**
 * Column decorator is used to mark a specific class property as a table column.
 * Only properties decorated with this decorator will be persisted to the database when entity be saved.
 * Primary columns also creates a PRIMARY KEY for this column in a db.
 */
export declare function PrimaryColumn(options?: ColumnOptions): Function;
/**
 * Column decorator is used to mark a specific class property as a table column.
 * Only properties decorated with this decorator will be persisted to the database when entity be saved.
 * Primary columns also creates a PRIMARY KEY for this column in a db.
 */
export declare function PrimaryColumn(type?: ColumnType, options?: ColumnOptions): Function;
