import { ColumnMetadataArgs } from "../../metadata-args/ColumnMetadataArgs";
import { ColumnOptions } from '../options/ColumnOptions';
import { getMetadataArgsStorage } from "../../metadata-args/get-metadata-args-storage";

/**
 * This column will store a delete date of the soft-deleted object.
 * This date is being updated each time you soft-delete the object.
 */
export function DeleteDateColumn(options?: ColumnOptions): Function {
    return function (object: Object, propertyName: string) {
        getMetadataArgsStorage().columns.push({
            target: object.constructor,
            propertyName: propertyName,
            mode: "deleteDate",
            options: options || {}
        } as ColumnMetadataArgs);
    };
}
