import { getMetadataArgsStorage } from "../../globals"
import type { ColumnMetadataArgs } from "../../metadata-args/ColumnMetadataArgs"
import type { ColumnOptions } from "../options/ColumnOptions"

/**
 * This column will store a creation date of the inserted object.
 * Creation date is generated and inserted only once,
 * at the first time when you create an object, the value is inserted into the table, and is never touched again.
 * @param options
 */
export function CreateDateColumn(options?: ColumnOptions): PropertyDecorator {
    return function (object: Object, propertyName: string) {
        getMetadataArgsStorage().columns.push({
            target: object.constructor,
            propertyName: propertyName,
            mode: "createDate",
            options: options || {},
        } as ColumnMetadataArgs)
    }
}
