import {ColumnOptions} from "../options/ColumnOptions";
import {GeneratedOnlyForPrimaryError} from "../../error/GeneratedOnlyForPrimaryError";
import {getMetadataArgsStorage} from "../../index";
import {
    ColumnType,
    SimpleColumnType,
    WithLengthColumnType,
    WithPrecisionColumnType
} from "../../driver/types/ColumnTypes";
import {ColumnMetadataArgs} from "../../metadata-args/ColumnMetadataArgs";
import {ColumnCommonOptions} from "../options/ColumnCommonOptions";
import {ColumnWithLengthOptions} from "../options/ColumnWithLengthOptions";
import {ColumnNumericOptions} from "../options/ColumnNumericOptions";
import {ColumnEnumOptions} from "../options/ColumnEnumOptions";
import {ColumnEmbeddedOptions} from "../options/ColumnEmbeddedOptions";
import {EmbeddedMetadataArgs} from "../../metadata-args/EmbeddedMetadataArgs";

/**
 * Column decorator is used to mark a specific class property as a table column. Only properties decorated with this
 * decorator will be persisted to the database when entity be saved.
 */
export function Column(): Function;

/**
 * Column decorator is used to mark a specific class property as a table column.
 * Only properties decorated with this decorator will be persisted to the database when entity be saved.
 */
export function Column(options: ColumnOptions): Function;

/**
 * Column decorator is used to mark a specific class property as a table column.
 * Only properties decorated with this decorator will be persisted to the database when entity be saved.
 */
export function Column(type: SimpleColumnType, options?: ColumnCommonOptions): Function;

/**
 * Column decorator is used to mark a specific class property as a table column.
 * Only properties decorated with this decorator will be persisted to the database when entity be saved.
 */
export function Column(type: WithLengthColumnType, options?: ColumnCommonOptions & ColumnWithLengthOptions): Function;

/**
 * Column decorator is used to mark a specific class property as a table column.
 * Only properties decorated with this decorator will be persisted to the database when entity be saved.
 */
export function Column(type: WithPrecisionColumnType, options?: ColumnCommonOptions & ColumnNumericOptions): Function;

/**
 * Column decorator is used to mark a specific class property as a table column.
 * Only properties decorated with this decorator will be persisted to the database when entity be saved.
 */
export function Column(type: "enum", options?: ColumnCommonOptions & ColumnEnumOptions): Function;

/**
 * Column decorator is used to mark a specific class property as a table column.
 * Only properties decorated with this decorator will be persisted to the database when entity be saved.
 *
 * Property in entity can be marked as Embedded, and on persist all columns from the embedded are mapped to the
 * single table of the entity where Embedded is used. And on hydration all columns which supposed to be in the
 * embedded will be mapped to it from the single table.
 */
export function Column(type: (type?: any) => Function, options?: ColumnEmbeddedOptions): Function;

/**
 * Column decorator is used to mark a specific class property as a table column.
 * Only properties decorated with this decorator will be persisted to the database when entity be saved.
 */
export function Column(typeOrOptions?: ((type?: any) => Function)|ColumnType|(ColumnOptions&ColumnEmbeddedOptions), options?: (ColumnOptions&ColumnEmbeddedOptions)): Function {
    let type: ColumnType|undefined;
    if (typeof typeOrOptions === "string" || typeOrOptions instanceof Function) {
        type = <ColumnType> typeOrOptions;

    } else if (typeOrOptions) {
        options = <ColumnOptions> typeOrOptions;
        type = typeOrOptions.type;
    }
    return function (object: Object, propertyName: string) {

        if (typeOrOptions instanceof Function) {

            const reflectMetadataType = Reflect && (Reflect as any).getMetadata ? (Reflect as any).getMetadata("design:type", object, propertyName) : undefined;
            const isArray = reflectMetadataType === Array || (options && options.array === true) ? true : false;

            const args: EmbeddedMetadataArgs = {
                target: object.constructor,
                propertyName: propertyName,
                isArray: isArray,
                prefix: options && options.prefix !== undefined ? options.prefix : undefined,
                type: typeOrOptions as (type?: any) => Function
            };
            getMetadataArgsStorage().embeddeds.push(args);

        } else {
            // if type is not given implicitly then try to guess it
            if (!type) {
                const reflectMetadataType = Reflect && (Reflect as any).getMetadata ? (Reflect as any).getMetadata("design:type", object, propertyName) : undefined;
                if (reflectMetadataType)
                    type = reflectMetadataType; // todo: need to determine later on driver level
            }

            // if column options are not given then create a new empty options
            if (!options) options = {} as ColumnOptions;

            // check if there is no type in column options then set type from first function argument, or guessed one
            if (!options.type && type)
                options = Object.assign({ type: type } as ColumnOptions, options);

            // check if auto increment is not set for simple column
            if (options.generated)
                throw new GeneratedOnlyForPrimaryError(object, propertyName);

            // create and register a new column metadata
            const args: ColumnMetadataArgs = {
                target: object.constructor,
                propertyName: propertyName,
                mode: "regular",
                options: options
            };
            getMetadataArgsStorage().columns.push(args);
        }

    };
}
