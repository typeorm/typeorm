import {getMetadataArgsStorage} from "../../index";
import {RelationOptions} from "../options/RelationOptions";
import {RelationMetadataArgs} from "../../metadata-args/RelationMetadataArgs";

/**
 * Marks a specific property of the class as a parent of the tree.
 */
export function TreeParent(options?: RelationOptions): Function {
    return function (object: Object, propertyName: string) {
        if (!options) options = {} as RelationOptions;

        // now try to determine it its lazy relation
        let isLazy = options && options.lazy === true ? true : false;
        if (!isLazy && Reflect && (Reflect as any).getMetadata) { // automatic determination
            const reflectedType = (Reflect as any).getMetadata("design:type", object, propertyName);
            if (reflectedType && typeof reflectedType.name === "string" && reflectedType.name.toLowerCase() === "promise")
                isLazy = true;
        }

        const args: RelationMetadataArgs = {
            isTreeParent: true,
            target: object.constructor,
            propertyName: propertyName,
            // propertyType: reflectedType,
            isLazy: isLazy,
            relationType: "many-to-one",
            type: () => object.constructor,
            options: options
        };
        getMetadataArgsStorage().relations.push(args);
    };
}

