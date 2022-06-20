import { getMetadataArgsStorage } from "../globals";
import { ObjectUtils } from "../util/ObjectUtils";
/**
 * Creates a database index.
 * Can be used on entity property or on entity.
 * Can create indices with composite columns when used on entity.
 */
export function Index(nameOrFieldsOrOptions, maybeFieldsOrOptions, maybeOptions) {
    // normalize parameters
    const name = typeof nameOrFieldsOrOptions === "string"
        ? nameOrFieldsOrOptions
        : undefined;
    const fields = typeof nameOrFieldsOrOptions === "string"
        ? maybeFieldsOrOptions
        : nameOrFieldsOrOptions;
    let options = ObjectUtils.isObject(nameOrFieldsOrOptions) &&
        !Array.isArray(nameOrFieldsOrOptions)
        ? nameOrFieldsOrOptions
        : maybeOptions;
    if (!options)
        options =
            ObjectUtils.isObject(maybeFieldsOrOptions) &&
                !Array.isArray(maybeFieldsOrOptions)
                ? maybeFieldsOrOptions
                : maybeOptions;
    return function (clsOrObject, propertyName) {
        getMetadataArgsStorage().indices.push({
            target: propertyName
                ? clsOrObject.constructor
                : clsOrObject,
            name: name,
            columns: propertyName ? [propertyName] : fields,
            synchronize: options &&
                options.synchronize === false
                ? false
                : true,
            where: options ? options.where : undefined,
            unique: options && options.unique ? true : false,
            spatial: options && options.spatial ? true : false,
            fulltext: options && options.fulltext ? true : false,
            nullFiltered: options && options.nullFiltered ? true : false,
            parser: options ? options.parser : undefined,
            sparse: options && options.sparse ? true : false,
            background: options && options.background ? true : false,
            expireAfterSeconds: options
                ? options.expireAfterSeconds
                : undefined,
        });
    };
}

//# sourceMappingURL=Index.js.map
