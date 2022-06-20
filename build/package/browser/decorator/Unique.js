import { getMetadataArgsStorage } from "../globals";
import { ObjectUtils } from "../util/ObjectUtils";
/**
 * Composite unique constraint must be set on entity classes and must specify entity's fields to be unique.
 */
export function Unique(nameOrFieldsOrOptions, maybeFieldsOrOptions, maybeOptions) {
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
            ObjectUtils.isObject(nameOrFieldsOrOptions) &&
                !Array.isArray(maybeFieldsOrOptions)
                ? maybeFieldsOrOptions
                : maybeOptions;
    return function (clsOrObject, propertyName) {
        let columns = fields;
        if (propertyName !== undefined) {
            switch (typeof propertyName) {
                case "string":
                    columns = [propertyName];
                    break;
                case "symbol":
                    columns = [propertyName.toString()];
                    break;
            }
        }
        const args = {
            target: propertyName
                ? clsOrObject.constructor
                : clsOrObject,
            name: name,
            columns,
            deferrable: options ? options.deferrable : undefined,
        };
        getMetadataArgsStorage().uniques.push(args);
    };
}

//# sourceMappingURL=Unique.js.map
