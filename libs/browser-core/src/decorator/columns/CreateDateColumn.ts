import { ColumnMetadataArgs } from "../../metadata-args/ColumnMetadataArgs";
import { ColumnOptions } from '../options/ColumnOptions';
import { getMetadataArgsStorage } from "../../metadata-args/get-metadata-args-storage";

/**
 * This column will store a creation date of the inserted object.
 * Creation date is generated and inserted only once,
 * at the first time when you create an object, the value is inserted into the table, and is never touched again.
 */
export function CreateDateColumn(options?: ColumnOptions): Function {
    return function (object: Object, propertyName: string) {
        getMetadataArgsStorage().columns.push({
            target: object.constructor,
            propertyName: propertyName,
            mode: "createDate",
            options: options || {}
        } as ColumnMetadataArgs);
    };
}
