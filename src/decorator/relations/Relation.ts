import {RelationType} from "../../metadata/types/RelationTypes";
import {getMetadataArgsStorage, ObjectType, RelationOptions} from "../..";
import {RelationMetadataArgs} from "../../metadata-args/RelationMetadataArgs";

/**
 * Relation to another entity, can be one-to-one, many-to-one, one-to-many or many-to-many
 */
export function Relation<T>(type: Exclude<RelationType, "one-to-many">,
                            typeFunctionOrTarget: string|((type?: any) => ObjectType<T>),
                            inverseSideOrOptions?: string|((object: T) => any)|RelationOptions,
                            options?: RelationOptions): PropertyDecorator;

/**
 * Relation to another entity, can be one-to-one, many-to-one, one-to-many or many-to-many
 */
export function Relation<T>(type: "one-to-many",
                            typeFunctionOrTarget: string|((type?: any) => ObjectType<T>),
                            inverseSideProperty: string|((object: T) => any), // Mandatory for one-to-many
                            options?: RelationOptions): PropertyDecorator;

/**
 * Relation to another entity, can be one-to-one, many-to-one, one-to-many or many-to-many
 */
export function Relation<T>(type: RelationType,
                            typeFunctionOrTarget: string|((type?: any) => ObjectType<T>),
                            inverseSideOrOptions?: string|((object: T) => any)|RelationOptions,
                            options?: RelationOptions): PropertyDecorator {
    // normalize parameters
    let inverseSideProperty: string|((object: T) => any);
    if (typeof inverseSideOrOptions === "object") {
        options = <RelationOptions> inverseSideOrOptions;
    } else {
        inverseSideProperty = <string|((object: T) => any)> inverseSideOrOptions;
    }

    return function (object: Object, propertyName: string) {
        if (!options) options = {} as RelationOptions;

        // now try to determine it its lazy relation
        let isLazy = options.lazy === true;
        if (!isLazy && Reflect && (Reflect as any).getMetadata) { // automatic determination
            const reflectedType = (Reflect as any).getMetadata("design:type", object, propertyName);
            if (reflectedType && typeof reflectedType.name === "string" && reflectedType.name.toLowerCase() === "promise")
                isLazy = true;
        }

        getMetadataArgsStorage().relations.push({
            target: object.constructor,
            propertyName: propertyName,
            // propertyType: reflectedType,
            relationType: type,
            isLazy: isLazy,
            type: typeFunctionOrTarget,
            inverseSideProperty: inverseSideProperty,
            options: options
        } as RelationMetadataArgs);
    };
}
