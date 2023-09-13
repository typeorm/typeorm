import { getMetadataArgsStorage } from "../../globals"
import { TableMetadataArgs } from "../../metadata-args/TableMetadataArgs"
import { EntityOptions } from "../options/EntityOptions"
import { ObjectUtils } from "../../util/ObjectUtils"

/**
 * This decorator is used to mark classes that will be an entity (table or document depend on database type).
 * Database schema will be created for all classes decorated with it, and Repository can be retrieved and used for it.
 */
export function Entity(options?: EntityOptions): ClassDecorator

/**
 * This decorator is used to mark classes that will be an entity (table or document depend on database type).
 * Database schema will be created for all classes decorated with it, and Repository can be retrieved and used for it.
 */
export function Entity(name?: string, options?: EntityOptions): ClassDecorator

/**
 * This decorator is used to mark classes that will be an entity (table or document depend on database type).
 * Database schema will be created for all classes decorated with it, and Repository can be retrieved and used for it.
 */
export function Entity(
    nameOrOptions?: string | EntityOptions,
    maybeOptions?: EntityOptions,
): ClassDecorator {
    const options =
        (ObjectUtils.isObject(nameOrOptions)
            ? (nameOrOptions as EntityOptions)
            : maybeOptions) || {}
    const name =
        typeof nameOrOptions === "string" ? nameOrOptions : options.name

    return function (target) {
        const versioning = {
            columnFrom:
                options.versioning === true || options.versioning === false
                    ? "row_start"
                    : options.versioning?.columnFrom || "row_start",
            columnTo:
                options.versioning === true || options.versioning === false
                    ? "row_end"
                    : options.versioning?.columnTo || "row_end",
        }

        getMetadataArgsStorage().tables.push({
            target,
            name,
            type: "regular",
            orderBy: options.orderBy ? options.orderBy : undefined,
            engine: options.engine ? options.engine : undefined,
            database: options.database ? options.database : undefined,
            schema: options.schema ? options.schema : undefined,
            synchronize: options.synchronize,
            withoutRowid: options.withoutRowid,
            versioning,
        } as TableMetadataArgs)
    }
}
