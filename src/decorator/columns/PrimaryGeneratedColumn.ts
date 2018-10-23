import {ColumnOptions, getMetadataArgsStorage} from "../../";
import {PrimaryGeneratedColumnNumericOptions} from "../options/PrimaryGeneratedColumnNumericOptions";
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

    // normalize parameters
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

        // if column type is not explicitly set then determine it based on generation strategy
        if (!options.type)
            options.type = strategy === "increment" ? Number : "uuid";

        // explicitly set a primary and generated to column options
        options.primary = true;

        function finisher(name: string, target: Function) {
            // register column metadata args
            getMetadataArgsStorage().columns.push({
                target,
                propertyName: name,
                mode: "regular",
                options: options
            });

            // register generated metadata args
            getMetadataArgsStorage().generations.push({
                target,
                propertyName: name,
                strategy: strategy
            } as GeneratedMetadataArgs);
        }
        if (propertyName) {
            finisher(propertyName, object.constructor);
            return;
        } else {
            return {...object, finisher: finisher.bind(this, (object as any).key)};
        }
    };
}
