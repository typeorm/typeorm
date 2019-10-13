"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var __1 = require("../../");
/**
 * ViewColumn decorator is used to mark a specific class property as a view column.
 */
function ViewColumn() {
    return function (object, propertyName) {
        __1.getMetadataArgsStorage().columns.push({
            target: object.constructor,
            propertyName: propertyName,
            mode: "regular",
            options: {}
        });
    };
}
exports.ViewColumn = ViewColumn;
//# sourceMappingURL=ViewColumn.js.map