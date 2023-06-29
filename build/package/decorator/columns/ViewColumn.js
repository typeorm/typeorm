"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ViewColumn = void 0;
const __1 = require("../../");
/**
 * ViewColumn decorator is used to mark a specific class property as a view column.
 */
function ViewColumn(options) {
    return function (object, propertyName) {
        (0, __1.getMetadataArgsStorage)().columns.push({
            target: object.constructor,
            propertyName: propertyName,
            mode: "regular",
            options: options || {}
        });
    };
}
exports.ViewColumn = ViewColumn;

//# sourceMappingURL=ViewColumn.js.map
