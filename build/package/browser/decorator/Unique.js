import { getMetadataArgsStorage } from "../index";
/**
 * Composite unique constraint must be set on entity classes and must specify entity's fields to be unique.
 */
export function Unique(nameOrFields, maybeFields) {
    var name = typeof nameOrFields === "string" ? nameOrFields : undefined;
    var fields = typeof nameOrFields === "string" ? maybeFields : nameOrFields;
    return function (clsOrObject, propertyName) {
        var columns = fields;
        if (propertyName !== undefined) {
            switch (typeof (propertyName)) {
                case "string":
                    columns = [propertyName];
                    break;
                case "symbol":
                    columns = [propertyName.toString()];
                    break;
            }
        }
        var args = {
            target: propertyName ? clsOrObject.constructor : clsOrObject,
            name: name,
            columns: columns,
        };
        getMetadataArgsStorage().uniques.push(args);
    };
}

//# sourceMappingURL=Unique.js.map
