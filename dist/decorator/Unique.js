"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var index_1 = require("../index");
/**
 * Composite unique constraint must be set on entity classes and must specify entity's fields to be unique.
 */
function Unique(nameOrFields, maybeFields) {
    var name = typeof nameOrFields === "string" ? nameOrFields : undefined;
    var fields = typeof nameOrFields === "string" ? maybeFields : nameOrFields;
    return function (clsOrObject, propertyName) {
        var args = {
            target: propertyName ? clsOrObject.constructor : clsOrObject,
            name: name,
            columns: propertyName ? [propertyName] : fields
        };
        index_1.getMetadataArgsStorage().uniques.push(args);
    };
}
exports.Unique = Unique;
//# sourceMappingURL=Unique.js.map