"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Unique = void 0;
var index_1 = require("../index");
/**
 * Composite unique constraint must be set on entity classes and must specify entity's fields to be unique.
 */
function Unique(nameOrFields, maybeFields) {
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
        index_1.getMetadataArgsStorage().uniques.push(args);
    };
}
exports.Unique = Unique;

//# sourceMappingURL=Unique.js.map
