import {RelationOptions} from "../options/RelationOptions";
import {getMetadataArgsStorage} from "../../index";
import {ObjectType} from "../../common/ObjectType";
import {RelationMetadataArgs} from "../../metadata-args/RelationMetadataArgs";

/**
 * Many-to-many is a type of relationship when Entity1 can have multiple instances of Entity2, and Entity2 can have
 * multiple instances of Entity1. To achieve it, this type of relation creates a junction table, where it storage
 * entity1 and entity2 ids. This is owner side of the relationship.
 */
export function ManyToMany<T>(typeFunction: (type?: any) => ObjectType<T>, options?: RelationOptions): Function;

/**
 * Many-to-many is a type of relationship when Entity1 can have multiple instances of Entity2, and Entity2 can have
 * multiple instances of Entity1. To achieve it, this type of relation creates a junction table, where it storage
 * entity1 and entity2 ids. This is owner side of the relationship.
 */
export function ManyToMany<T>(typeFunction: (type?: any) => ObjectType<T>,
                              inverseSide?: string|((object: T) => any),
                              options?: RelationOptions): Function;

/**
 * Many-to-many is a type of relationship when Entity1 can have multiple instances of Entity2, and Entity2 can have
 * multiple instances of Entity1. To achieve it, this type of relation creates a junction table, where it storage
 * entity1 and entity2 ids. This is owner side of the relationship.
 */
export function ManyToMany<T>(typeFunction: (type?: any) => ObjectType<T>,
                              inverseSideOrOptions?: string|((object: T) => any)|RelationOptions,
                              options?: RelationOptions): Function {
    let inverseSideProperty: string|((object: T) => any);
    if (typeof inverseSideOrOptions === "object") {
        options = <RelationOptions> inverseSideOrOptions;
    } else {
        inverseSideProperty = <string|((object: T) => any)> inverseSideOrOptions;
    }

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
            target: object.constructor,
            propertyName: propertyName,
            // propertyType: reflectedType,
            relationType: "many-to-many",
            isLazy: isLazy,
            type: typeFunction,
            inverseSideProperty: inverseSideProperty,
            options: options
        };
        getMetadataArgsStorage().relations.push(args);
    };
}

