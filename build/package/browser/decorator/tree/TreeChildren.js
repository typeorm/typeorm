import { getMetadataArgsStorage } from "../../globals";
/**
 * Marks a entity property as a children of the tree.
 * "Tree children" will contain all children (bind) of this entity.
 */
export function TreeChildren(options) {
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
        // add one-to-many relation for this
        getMetadataArgsStorage().relations.push({
            isTreeChildren: true,
            target: object.constructor,
            propertyName: propertyName,
            isLazy: isLazy,
            relationType: "one-to-many",
            type: () => object.constructor,
            options: options,
        });
    };
}

//# sourceMappingURL=TreeChildren.js.map
