import {Column, ColumnOptions, ColumnType} from "../../";

/**
 * Describes all primary key column's options.
 * If specified, the nullable field must be set to false.
 */
export type PrimaryColumnOptions = ColumnOptions & { nullable?: false };

/**
 * Column decorator is used to mark a specific class property as a table column.
 * Only properties decorated with this decorator will be persisted to the database when entity be saved.
 * Primary columns also creates a PRIMARY KEY for this column in a db.
 */
export function PrimaryColumn(options?: PrimaryColumnOptions): PropertyDecorator;

/**
 * Column decorator is used to mark a specific class property as a table column.
 * Only properties decorated with this decorator will be persisted to the database when entity be saved.
 * Primary columns also creates a PRIMARY KEY for this column in a db.
 */
export function PrimaryColumn(type?: ColumnType, options?: PrimaryColumnOptions): PropertyDecorator;

/**
 * Column decorator is used to mark a specific class property as a table column.
 * Only properties decorated with this decorator will be persisted to the database when entity be saved.
 * Primary columns also creates a PRIMARY KEY for this column in a db.
 */

export function PrimaryColumn(typeOrOptions?: ColumnType|PrimaryColumnOptions, maybeOptions?: PrimaryColumnOptions): PropertyDecorator {
    // normalize parameters
    let options: ColumnOptions;
    if (typeof typeOrOptions === "string" || typeOrOptions instanceof Function) {
        options = {
            type: typeOrOptions,
            ...maybeOptions
        };
    } else {
        options = {...typeOrOptions};
    }

    // explicitly set a primary to column options
    options.primary = true;

    return Column(options);
}
