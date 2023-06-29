import { getMetadataArgsStorage } from "../../";
/**
 * This decorator is used to mark classes that will be an entity view.
 * Database schema will be created for all classes decorated with it, and Repository can be retrieved and used for it.
 */
export function ViewEntity(nameOrOptions, maybeOptions) {
    const options = (typeof nameOrOptions === "object" ? nameOrOptions : maybeOptions) || {};
    const name = typeof nameOrOptions === "string" ? nameOrOptions : options.name;
    return function (target) {
        getMetadataArgsStorage().tables.push({
            target: target,
            name: name,
            expression: options.expression,
            type: "view",
            database: options.database ? options.database : undefined,
            schema: options.schema ? options.schema : undefined,
            synchronize: options.synchronize === false ? false : true,
            materialized: !!options.materialized
        });
    };
}

//# sourceMappingURL=ViewEntity.js.map
