import {ObjectType, RelationOptions} from "../../";
import {Relation} from "./Relation";

/**
 * Many-to-many is a type of relationship when Entity1 can have multiple instances of Entity2, and Entity2 can have
 * multiple instances of Entity1. To achieve it, this type of relation creates a junction table, where it storage
 * entity1 and entity2 ids. This is owner side of the relationship.
 */
export function ManyToMany<T>(typeFunctionOrTarget: string|((type?: any) => ObjectType<T>),
                              options?: RelationOptions): PropertyDecorator;

/**
 * Many-to-many is a type of relationship when Entity1 can have multiple instances of Entity2, and Entity2 can have
 * multiple instances of Entity1. To achieve it, this type of relation creates a junction table, where it storage
 * entity1 and entity2 ids. This is owner side of the relationship.
 */
export function ManyToMany<T>(typeFunctionOrTarget: string|((type?: any) => ObjectType<T>),
                              inverseSide?: string|((object: T) => any),
                              options?: RelationOptions): PropertyDecorator;

/**
 * Many-to-many is a type of relationship when Entity1 can have multiple instances of Entity2, and Entity2 can have
 * multiple instances of Entity1. To achieve it, this type of relation creates a junction table, where it storage
 * entity1 and entity2 ids. This is owner side of the relationship.
 */
export function ManyToMany<T>(typeFunctionOrTarget: string|((type?: any) => ObjectType<T>),
                              inverseSideOrOptions?: string|((object: T) => any)|RelationOptions,
                              options?: RelationOptions): PropertyDecorator {
    return Relation<T>("many-to-many", typeFunctionOrTarget, inverseSideOrOptions, options);
}
