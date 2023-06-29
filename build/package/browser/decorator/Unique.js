import { getMetadataArgsStorage } from "../index";
/**
 * Composite unique constraint must be set on entity classes and must specify entity's fields to be unique.
 */
export function Unique(nameOrFields, maybeFields) {
    const name = typeof nameOrFields === "string" ? nameOrFields : undefined;
    const fields = typeof nameOrFields === "string" ? maybeFields : nameOrFields;
    return function (clsOrObject, propertyName) {
        let columns = fields;
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
        const args = {
            target: propertyName ? clsOrObject.constructor : clsOrObject,
            name: name,
            columns,
        };
        getMetadataArgsStorage().uniques.push(args);
    };
}

//# sourceMappingURL=Unique.js.map
