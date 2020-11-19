import { ColumnOptions, getMetadataArgsStorage } from "../../";
import {
    ColumnType, SimpleColumnType, SpatialColumnType
} from "../../driver/types/ColumnTypes";
import {ColumnMetadataArgs} from "../../metadata-args/ColumnMetadataArgs";
import {ColumnTypeUndefinedError} from "../../error/ColumnTypeUndefinedError";
import { ColumnEnumOptions } from '../options/ColumnEnumOptions';
import { ColumnHstoreOptions } from '../options/ColumnHstoreOptions';
import { SpatialColumnOptions } from '../options/SpatialColumnOptions';
import { VirtualOptions } from '../options/VirtualOptions';

/**
 * Column decorator is used to mark a specific class property as a table column.
 * Only properties decorated with this decorator will be persisted to the database when entity be saved.
 */
export function Virtual(): PropertyDecorator;

/**
 * Column decorator is used to mark a specific class property as a table column.
 * Only properties decorated with this decorator will be persisted to the database when entity be saved.
 */
export function Virtual(type: VirtualOptions): PropertyDecorator;

/**
 * Column decorator is used to mark a specific class property as a table column.
 * Only properties decorated with this decorator will be persisted to the database when entity be saved.
 */
export function Virtual(type: SimpleColumnType): PropertyDecorator;

/**
 * Column decorator is used to mark a specific class property as a table column.
 * Only properties decorated with this decorator will be persisted to the database when entity be saved.
 */
export function Virtual(type: SpatialColumnType, options?: VirtualOptions & SpatialColumnOptions): PropertyDecorator;

/**
 * Column decorator is used to mark a specific class property as a table column.
 * Only properties decorated with this decorator will be persisted to the database when entity be saved.
 */
export function Virtual(type: "enum", options?: ColumnEnumOptions): PropertyDecorator;

/**
 * Column decorator is used to mark a specific class property as a table column.
 * Only properties decorated with this decorator will be persisted to the database when entity be saved.
 */
export function Virtual(type: "simple-enum", options?: ColumnEnumOptions): PropertyDecorator;

/**
 * Column decorator is used to mark a specific class property as a table column.
 * Only properties decorated with this decorator will be persisted to the database when entity be saved.
 */
export function Virtual(type: "set", options?: ColumnEnumOptions): PropertyDecorator;

/**
 * Column decorator is used to mark a specific class property as a table column.
 * Only properties decorated with this decorator will be persisted to the database when entity be saved.
 */
export function Virtual(type: "hstore", options?: ColumnHstoreOptions): PropertyDecorator;

/**
 * Column decorator is used to mark a specific class property as a table column.
 * Only properties decorated with this decorator will be persisted to the database when entity be saved.
 */
export function Virtual(typeOrOptions?: ColumnType|VirtualOptions, options?: VirtualOptions): PropertyDecorator {
    return function (object: Object, propertyName: string) {

        // normalize parameters
        let type: ColumnType|undefined;
        if (typeof typeOrOptions === "string" || typeOrOptions instanceof Function) {
            type = <ColumnType> typeOrOptions;

        } else if (typeOrOptions) {
            options = <ColumnOptions> typeOrOptions;
            type = typeOrOptions.type;
        }
        if (!options) options = {} as ColumnOptions;

        // if type is not given explicitly then try to guess it
        const reflectMetadataType = Reflect && (Reflect as any).getMetadata ? (Reflect as any).getMetadata("design:type", object, propertyName) : undefined;
        if (!type && reflectMetadataType) // if type is not given explicitly then try to guess it
            type = reflectMetadataType;

        // check if there is no type in column options then set type from first function argument, or guessed one
        if (!options.type && type)
            options.type = type;

        // specify HSTORE type if column is HSTORE
        if (options.type === "hstore" && !options.hstoreType)
            options.hstoreType = reflectMetadataType === Object ? "object" : "string";

         // register a regular column
        if (!options.type)
            throw new ColumnTypeUndefinedError(object, propertyName);
        getMetadataArgsStorage().columns.push({
            target: object.constructor,
            propertyName: propertyName,
            mode: "computed",
            options: {
                ...options,
                select: false,
                insert: false,
                update: false
            }
        } as ColumnMetadataArgs);
    };
}
