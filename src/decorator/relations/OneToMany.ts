import {getMetadataArgsStorage} from "../../index";
import {ObjectType} from "../../common/ObjectType";
import {RelationMetadataArgs} from "../../metadata-args/RelationMetadataArgs";
import {RelationOptions} from "../options/RelationOptions";

// todo: make decorators which use inverse side string separate

/**
 * One-to-many relation allows to create type of relation when Entity2 can have multiple instances of Entity1.
 * Entity1 have only one Entity2. Entity1 is an owner of the relationship, and storages Entity2 id on its own side.
 */
export function OneToMany<T>(typeFunction: (type?: any) => ObjectType<T>, inverseSide: string|((object: T) => any), options?: { cascadeInsert?: boolean, cascadeUpdate?: boolean, lazy?: boolean }): Function {
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
            isLazy: isLazy,
            relationType: "one-to-many",
            type: typeFunction,
            inverseSideProperty: inverseSide,
            options: options
        };
        getMetadataArgsStorage().relations.push(args);
    };
}

