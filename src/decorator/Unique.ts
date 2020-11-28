import {getMetadataArgsStorage} from "../index";
import {UniqueMetadataArgs} from "../metadata-args/UniqueMetadataArgs";
import {IndexFieldsMap} from "../metadata-args/types/IndexFieldsMap";

/**
 * Composite unique constraint must be set on entity property or on entity and must specify entity's fields to be unique.
 */
export function Unique(name?: string): ClassDecorator & PropertyDecorator;

/**
 * Composite unique constraint must be set on entity and must specify entity's fields to be unique.
 */
export function Unique(fields: string[] | IndexFieldsMap): ClassDecorator;

/**
 * Composite unique constraint must be set on entity and must specify entity's fields to be unique.
 */
export function Unique(name: string, fields: string[] | IndexFieldsMap): ClassDecorator;

/**
 * Composite unique constraint must be set on entity property or on entity and must specify entity's fields to be unique.
 */
export function Unique(
    nameOrFields?: string | string[] | IndexFieldsMap,
    maybeFields?: string[] | IndexFieldsMap
): ClassDecorator & PropertyDecorator {
    const name = typeof nameOrFields === "string" ? nameOrFields : undefined;
    const fields = <IndexFieldsMap | string[]>(typeof nameOrFields === "string" ? maybeFields : nameOrFields);

    return function (clsOrObject: Function|Object, propertyName?: string | symbol) {
        getMetadataArgsStorage().uniques.push({
            target: propertyName ? clsOrObject.constructor : clsOrObject as Function,
            name: name,
            columns: propertyName ? [propertyName] : fields
        } as UniqueMetadataArgs);
    };
}
