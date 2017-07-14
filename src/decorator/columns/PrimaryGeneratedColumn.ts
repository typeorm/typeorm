import {getMetadataArgsStorage} from "../../index";
import {ColumnMetadataArgs} from "../../metadata-args/ColumnMetadataArgs";
import {PrimaryGeneratedColumnType} from "../../driver/types/ColumnTypes";
import {PrimaryGeneratedColumnOptions} from "../options/PrimaryGeneratedColumnOptions";
import {ColumnOptions} from "../options/ColumnOptions";

/**
 * Column decorator is used to mark a specific class property as a table column.
 */
export function PrimaryGeneratedColumn(): Function;

/**
 * Column decorator is used to mark a specific class property as a table column.
 */
export function PrimaryGeneratedColumn(options: PrimaryGeneratedColumnOptions): Function;

/**
 * Column decorator is used to mark a specific class property as a table column.
 */
export function PrimaryGeneratedColumn(type: PrimaryGeneratedColumnType, options?: PrimaryGeneratedColumnOptions): Function;

/**
 * Column decorator is used to mark a specific class property as a table column.
 * Only properties decorated with this decorator will be persisted to the database when entity be saved.
 * This column creates an integer PRIMARY COLUMN with generated set to true.
 * This column creates is an alias for @PrimaryColumn("int", { generated: true }).
 */
export function PrimaryGeneratedColumn(typeOrOptions?: PrimaryGeneratedColumnType|PrimaryGeneratedColumnOptions, maybeOptions?: PrimaryGeneratedColumnOptions): Function {
    const options: ColumnOptions = {};

    if (typeof typeOrOptions === "string")  options.type = typeOrOptions;
    if (typeOrOptions instanceof Object) Object.assign(options, typeOrOptions);
    if (maybeOptions instanceof Object) Object.assign(options, maybeOptions);

    return function (object: Object, propertyName: string) {

        // check if there is no type in column options then set the int type - by default for auto generated column
        if (!options.type)
            Object.assign(options, { type: Number}  as ColumnOptions);

        // implicitly set a primary and generated to column options
        Object.assign(options, { primary: true, generated: true } as ColumnOptions);

        // create and register a new column metadata
        const args: ColumnMetadataArgs = {
            target: object.constructor,
            propertyName: propertyName,
            mode: "regular",
            options: options
        };
        getMetadataArgsStorage().columns.push(args);
    };
}

