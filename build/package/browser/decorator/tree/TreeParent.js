import { getMetadataArgsStorage } from "../../globals";
/**
 * Marks a entity property as a parent of the tree.
 * "Tree parent" indicates who owns (is a parent) of this entity in tree structure.
 */
export function TreeParent(options) {
    return function (object, propertyName) {
        if (!options)
            options = {};
        // now try to determine it its lazy relation
        const reflectedType = Reflect && Reflect.getMetadata
            ? Reflect.getMetadata("design:type", object, propertyName)
            : undefined;
        const isLazy = (reflectedType &&
            typeof reflectedType.name === "string" &&
            reflectedType.name.toLowerCase() === "promise") ||
            false;
        getMetadataArgsStorage().relations.push({
            isTreeParent: true,
            target: object.constructor,
            propertyName: propertyName,
            isLazy: isLazy,
            relationType: "many-to-one",
            type: () => object.constructor,
            options: options,
        });
    };
}

//# sourceMappingURL=TreeParent.js.map
