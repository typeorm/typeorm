"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Index = void 0;
const __1 = require("../");
/**
 * Creates a database index.
 * Can be used on entity property or on entity.
 * Can create indices with composite columns when used on entity.
 */
function Index(nameOrFieldsOrOptions, maybeFieldsOrOptions, maybeOptions) {
    // normalize parameters
    const name = typeof nameOrFieldsOrOptions === "string" ? nameOrFieldsOrOptions : undefined;
    const fields = typeof nameOrFieldsOrOptions === "string" ? maybeFieldsOrOptions : nameOrFieldsOrOptions;
    let options = (typeof nameOrFieldsOrOptions === "object" && !Array.isArray(nameOrFieldsOrOptions)) ? nameOrFieldsOrOptions : maybeOptions;
    if (!options)
        options = (typeof maybeFieldsOrOptions === "object" && !Array.isArray(maybeFieldsOrOptions)) ? maybeFieldsOrOptions : maybeOptions;
    return function (clsOrObject, propertyName) {
        (0, __1.getMetadataArgsStorage)().indices.push({
            target: propertyName ? clsOrObject.constructor : clsOrObject,
            name: name,
            columns: propertyName ? [propertyName] : fields,
            synchronize: options && options.synchronize === false ? false : true,
            where: options ? options.where : undefined,
            unique: options && options.unique ? true : false,
            spatial: options && options.spatial ? true : false,
            fulltext: options && options.fulltext ? true : false,
            parser: options ? options.parser : undefined,
            sparse: options && options.sparse ? true : false,
            background: options && options.background ? true : false,
            expireAfterSeconds: options ? options.expireAfterSeconds : undefined
        });
    };
}
exports.Index = Index;

//# sourceMappingURL=Index.js.map
