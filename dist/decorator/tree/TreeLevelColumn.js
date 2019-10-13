"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var __1 = require("../../");
/**
 * Creates a "level"/"length" column to the table that holds a closure table.
 */
function TreeLevelColumn() {
    return function (object, propertyName) {
        __1.getMetadataArgsStorage().columns.push({
            target: object.constructor,
            propertyName: propertyName,
            mode: "treeLevel",
            options: {}
        });
    };
}
exports.TreeLevelColumn = TreeLevelColumn;
//# sourceMappingURL=TreeLevelColumn.js.map