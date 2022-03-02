import { getMetadataArgsStorage } from "../..";
import { IndexMetadataArgs } from "../../metadata-args/IndexMetadataArgs";

export interface GlobalSecondaryIndexOptions {
    name: string
    partitionKey: string | string[]
    sortKey?: string | string[]
}

/**
 * Creates a database index.
 * Can be used on entity.
 * Can create indices with composite columns when used on entity.
 */
export function GlobalSecondaryIndex (options: GlobalSecondaryIndexOptions): ClassDecorator {
    options = options || {};
    options.sortKey = options.sortKey || [];
    const name = options.name;
    const partitionColumns = Array.isArray(options.partitionKey) ? options.partitionKey : [options.partitionKey];
    return function (clsOrObject: Function|Object, propertyName?: string | symbol) {
        getMetadataArgsStorage().indices.push({
            target: propertyName ? clsOrObject.constructor : clsOrObject as Function,
            name: name,
            columns: propertyName ? [propertyName] : partitionColumns,
            where: Array.isArray(options.sortKey) ? options.sortKey.join("#") : options.sortKey
        } as IndexMetadataArgs);
    };
}
