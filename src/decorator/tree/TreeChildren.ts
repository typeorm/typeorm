import {getMetadataArgsStorage} from "../../index";
import {RelationOptions} from "../options/RelationOptions";
import {RelationMetadataArgs} from "../../metadata-args/RelationMetadataArgs";

/**
 * Marks a specific property of the class as a children of the tree.
 */
export function TreeChildren(options?: { cascadeInsert?: boolean, cascadeUpdate?: boolean, lazy?: boolean }): Function {
    return function (object: Object, propertyName: string) {
        if (!options) options = {} as RelationOptions;

        // now try to determine it its lazy relation
        let isLazy = options && options.lazy === true ? true : false;
        if (!isLazy && Reflect && (Reflect as any).getMetadata) { // automatic determination
            const reflectedType = (Reflect as any).getMetadata("design:type", object, propertyName);
            if (reflectedType && typeof reflectedType.name === "string" && reflectedType.name.toLowerCase() === "promise")
                isLazy = true;
        }

        // add one-to-many relation for this 
        const args: RelationMetadataArgs = {
            isTreeChildren: true,
            target: object.constructor,
            propertyName: propertyName,
            // propertyType: reflectedType,
            isLazy: isLazy,
            relationType: "one-to-many",
            type: () => object.constructor,
            options: options
        };
        getMetadataArgsStorage().relations.push(args);
    };
}

