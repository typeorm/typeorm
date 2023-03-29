"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ViewEntity = void 0;
var __1 = require("../../");
/**
 * This decorator is used to mark classes that will be an entity view.
 * Database schema will be created for all classes decorated with it, and Repository can be retrieved and used for it.
 */
function ViewEntity(nameOrOptions, maybeOptions) {
    var options = (typeof nameOrOptions === "object" ? nameOrOptions : maybeOptions) || {};
    var name = typeof nameOrOptions === "string" ? nameOrOptions : options.name;
    return function (target) {
        __1.getMetadataArgsStorage().tables.push({
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
exports.ViewEntity = ViewEntity;

//# sourceMappingURL=ViewEntity.js.map
