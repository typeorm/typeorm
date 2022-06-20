import { getMetadataArgsStorage } from "../../globals";
import { ObjectUtils } from "../../util/ObjectUtils";
/**
 * This decorator is used to mark classes that will be an entity (table or document depend on database type).
 * Database schema will be created for all classes decorated with it, and Repository can be retrieved and used for it.
 */
export function Entity(nameOrOptions, maybeOptions) {
    const options = (ObjectUtils.isObject(nameOrOptions)
        ? nameOrOptions
        : maybeOptions) || {};
    const name = typeof nameOrOptions === "string" ? nameOrOptions : options.name;
    return function (target) {
        getMetadataArgsStorage().tables.push({
            target: target,
            name: name,
            type: "regular",
            orderBy: options.orderBy ? options.orderBy : undefined,
            engine: options.engine ? options.engine : undefined,
            database: options.database ? options.database : undefined,
            schema: options.schema ? options.schema : undefined,
            synchronize: options.synchronize,
            withoutRowid: options.withoutRowid,
        });
    };
}

//# sourceMappingURL=Entity.js.map
