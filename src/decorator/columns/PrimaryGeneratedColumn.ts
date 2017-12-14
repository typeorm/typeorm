import {getMetadataArgsStorage} from "../../index";
import {ColumnMetadataArgs} from "../../metadata-args/ColumnMetadataArgs";
import {PrimaryGeneratedColumnNumericOptions} from "../options/PrimaryGeneratedColumnNumericOptions";
import {ColumnOptions} from "../options/ColumnOptions";
import {PrimaryGeneratedColumnUUIDOptions} from "../options/PrimaryGeneratedColumnUUIDOptions";
import {GeneratedMetadataArgs} from "../../metadata-args/GeneratedMetadataArgs";

/**
 * Column decorator is used to mark a specific class property as a table column.
 */
export function PrimaryGeneratedColumn(): Function;

/**
 * Column decorator is used to mark a specific class property as a table column.
 */
export function PrimaryGeneratedColumn(options: PrimaryGeneratedColumnNumericOptions): Function;

/**
 * Column decorator is used to mark a specific class property as a table column.
 */
export function PrimaryGeneratedColumn(strategy: "increment", options?: PrimaryGeneratedColumnNumericOptions): Function;

/**
 * Column decorator is used to mark a specific class property as a table column.
 */
export function PrimaryGeneratedColumn(strategy: "uuid", options?: PrimaryGeneratedColumnUUIDOptions): Function;

/**
 * Column decorator is used to mark a specific class property as a table column.
 * Only properties decorated with this decorator will be persisted to the database when entity be saved.
 * This column creates an integer PRIMARY COLUMN with generated set to true.
 */
export function PrimaryGeneratedColumn(strategyOrOptions?: "increment"|"uuid"|PrimaryGeneratedColumnNumericOptions|PrimaryGeneratedColumnUUIDOptions,
                                       maybeOptions?: PrimaryGeneratedColumnNumericOptions|PrimaryGeneratedColumnUUIDOptions): Function {
    const options: ColumnOptions = {};
    let strategy: "increment"|"uuid";

    if (strategyOrOptions) {
        if (typeof strategyOrOptions === "string")
            strategy = strategyOrOptions as "increment"|"uuid";

        if (strategyOrOptions instanceof Object) {
            strategy = "increment";
            Object.assign(options, strategyOrOptions);
        }
    } else {
        strategy = "increment";
    }

    if (maybeOptions instanceof Object)
        Object.assign(options, maybeOptions);

    return function (object: Object, propertyName: string) {

        // check if there is no type in column options then set the int type - by default for auto generated column
        if (!options.type) {
            if (strategy === "increment") {
                Object.assign(options, { type: Number } as ColumnOptions);
            } else {
                Object.assign(options, { type: "uuid" } as ColumnOptions);
            }
        }

        // implicitly set a primary and generated to column options
        Object.assign(options, { primary: true } as ColumnOptions);

        // create and register a new column metadata
        const columnArgs: ColumnMetadataArgs = {
            target: object.constructor,
            propertyName: propertyName,
            category: "regular",
            options: options
        };
        getMetadataArgsStorage().columns.push(columnArgs);

        const generationArgs: GeneratedMetadataArgs = {
            target: object.constructor,
            propertyName: propertyName,
            strategy: strategy
        };
        getMetadataArgsStorage().generations.push(generationArgs);
    };
}

