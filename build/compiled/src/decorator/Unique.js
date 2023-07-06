"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Unique = void 0;
const index_1 = require("../index");
/**
 * Composite unique constraint must be set on entity classes and must specify entity's fields to be unique.
 */
function Unique(nameOrFields, maybeFields) {
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
        (0, index_1.getMetadataArgsStorage)().uniques.push(args);
    };
}
exports.Unique = Unique;
//# sourceMappingURL=Unique.js.map