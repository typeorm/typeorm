import { ColumnOptions, getMetadataArgsStorage } from "../../";
import { ColumnMetadataArgs } from "../../metadata-args/ColumnMetadataArgs";

/**
 * This column will store a delete date of the soft-deleted object.
 * This date is being updated each time you soft-delete the object.
 */
export function DeleteDateColumn(options?: ColumnOptions): PropertyDecorator {
    return function(object: Object, propertyName: string) {
        getMetadataArgsStorage().columns.push({
            target: object.constructor,
            propertyName: propertyName,
            mode: "deleteDate",
            options: options || {}
        } as ColumnMetadataArgs);
    };
}
