import {getMetadataArgsStorage, ObjectType, RelationOptions} from "../../";
import {RelationMetadataArgs} from "../../metadata-args/RelationMetadataArgs";

/**
 * One-to-many relation allows us to create a type of relation where Entity1 can have multiple instances of Entity2.
 * Entity2 has only one Entity1. Entity2 is the owner of the relationship and stores Entity1's id on its own side.
 */
export function OneToMany<T>(typeFunctionOrTarget: string|((type?: any) => ObjectType<T>), inverseSide: string|((object: T) => any), options?: RelationOptions): PropertyDecorator {
    return function (object: Object, propertyName: string) {
        if (!options) options = {} as RelationOptions;

        // now try to determine it its lazy relation
        let isLazy = options && options.lazy === true ? true : false;
        if (!isLazy && Reflect && (Reflect as any).getMetadata) { // automatic determination
            const reflectedType = (Reflect as any).getMetadata("design:type", object, propertyName);
            if (reflectedType && typeof reflectedType.name === "string" && reflectedType.name.toLowerCase() === "promise")
                isLazy = true;
        }

        getMetadataArgsStorage().relations.push({
            target: object.constructor,
            propertyName: propertyName,
            // propertyType: reflectedType,
            isLazy: isLazy,
            relationType: "one-to-many",
            type: typeFunctionOrTarget,
            inverseSideProperty: inverseSide,
            options: options
        } as RelationMetadataArgs);
    };
}
