"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TreeParent = void 0;
var __1 = require("../../");
/**
 * Marks a entity property as a parent of the tree.
 * "Tree parent" indicates who owns (is a parent) of this entity in tree structure.
 */
function TreeParent() {
    return function (object, propertyName) {
        // now try to determine it its lazy relation
        var reflectedType = Reflect && Reflect.getMetadata ? Reflect.getMetadata("design:type", object, propertyName) : undefined;
        var isLazy = (reflectedType && typeof reflectedType.name === "string" && reflectedType.name.toLowerCase() === "promise") || false;
        __1.getMetadataArgsStorage().relations.push({
            isTreeParent: true,
            target: object.constructor,
            propertyName: propertyName,
            isLazy: isLazy,
            relationType: "many-to-one",
            type: function () { return object.constructor; },
            options: {}
        });
    };
}
exports.TreeParent = TreeParent;

//# sourceMappingURL=TreeParent.js.map
