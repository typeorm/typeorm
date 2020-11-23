import {ColumnOptions, getMetadataArgsStorage} from "../../";
import {ColumnMetadataArgs} from "../../metadata-args/ColumnMetadataArgs";

/**
 * Special type of column that is available only for MongoDB database.
 * Marks your entity's column to be an object id.
 */
export function ObjectIdColumn(options?: ColumnOptions): PropertyDecorator {
    return function (object: Object, propertyName: string) {
        // create and register a new column metadata
        getMetadataArgsStorage().columns.push({
            target: object.constructor,
            propertyName: propertyName,
            mode: "objectId",
            options: {
                name: "_id", // default name
                ...options, // overwrite name if provided
                primary: true // force primary
            }
        } as ColumnMetadataArgs);
    };
}
