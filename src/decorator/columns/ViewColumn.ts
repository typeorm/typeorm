import { getMetadataArgsStorage } from "../../globals"
import type { ColumnMetadataArgs } from "../../metadata-args/ColumnMetadataArgs"
import type { ViewColumnOptions } from "../options/ViewColumnOptions"

/**
 * ViewColumn decorator is used to mark a specific class property as a view column.
 * @param options
 */
export function ViewColumn(options?: ViewColumnOptions): PropertyDecorator {
    return function (object: Object, propertyName: string) {
        getMetadataArgsStorage().columns.push({
            target: object.constructor,
            propertyName: propertyName,
            mode: "regular",
            options: options || {},
        } as ColumnMetadataArgs)
    }
}
