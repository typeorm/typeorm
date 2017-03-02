import {ColumnOptions} from "../options/ColumnOptions";
import {GeneratedOnlyForPrimaryError} from "../error/GeneratedOnlyForPrimaryError";
import {getMetadataArgsStorage} from "../../index";
import {ColumnType, ColumnTypes} from "../../metadata/types/ColumnTypes";
import {ColumnMetadataArgs} from "../../metadata-args/ColumnMetadataArgs";

/**
 * Column decorator is used to mark a specific class property as a table column. Only properties decorated with this
 * decorator will be persisted to the database when entity be saved.
 */
export function Column(): Function;

/**
 * Column decorator is used to mark a specific class property as a table column.
 * Only properties decorated with this decorator will be persisted to the database when entity be saved.
 */
export function Column(type: ColumnType): Function;

/**
 * Column decorator is used to mark a specific class property as a table column.
 * Only properties decorated with this decorator will be persisted to the database when entity be saved.
 */
export function Column(options: ColumnOptions): Function;

/**
 * Column decorator is used to mark a specific class property as a table column.
 * Only properties decorated with this decorator will be persisted to the database when entity be saved.
 */
export function Column(type: ColumnType, options: ColumnOptions): Function;

/**
 * Column decorator is used to mark a specific class property as a table column.
 * Only properties decorated with this decorator will be persisted to the database when entity be saved.
 */
export function Column(typeOrOptions?: ColumnType|ColumnOptions, options?: ColumnOptions): Function {
    let type: ColumnType|undefined;
    if (typeof typeOrOptions === "string") {
        type = <ColumnType> typeOrOptions;

    } else if (typeOrOptions) {
        options = <ColumnOptions> typeOrOptions;
        type = typeOrOptions.type;
    }
    return function (object: Object, propertyName: string) {

        // todo: need to store not string type, but original type instead? (like in relation metadata)
        // const reflectedType = ColumnTypes.typeToString((Reflect as any).getMetadata("design:type", object, propertyName));

        // if type is not given implicitly then try to guess it
        if (!type) {
            const reflectMetadataType = Reflect && (Reflect as any).getMetadata ? (Reflect as any).getMetadata("design:type", object, propertyName) : undefined;
            if (reflectMetadataType)
                type = ColumnTypes.determineTypeFromFunction(reflectMetadataType);
        }

        // if column options are not given then create a new empty options
        if (!options) options = {} as ColumnOptions;

        // check if there is no type in column options then set type from first function argument, or guessed one
        if (!options.type && type)
            options = Object.assign({ type: type } as ColumnOptions, options);

        // if we still don't have a type then we need to give error to user that type is required
        // if (!options.type)
        //     throw new ColumnTypeUndefinedError(object, propertyName);

        // check if auto increment is not set for simple column
        if (options.generated)
            throw new GeneratedOnlyForPrimaryError(object, propertyName);

        // create and register a new column metadata
        const args: ColumnMetadataArgs = {
            target: object.constructor,
            propertyName: propertyName,
            // propertyType: reflectedType,
            mode: "regular",
            options: options
        };
        getMetadataArgsStorage().columns.add(args);
    };
}
