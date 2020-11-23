import {ObjectType, RelationOptions} from "../../";
import {Relation} from "./Relation";

/**
 * A many-to-one relation allows creating the type of relation where Entity1 can have a single instance of Entity2, but
 * Entity2 can have multiple instances of Entity1. Entity1 is the owner of the relationship, and stores the id of
 * Entity2 on its side of the relation.
 */
export function ManyToOne<T>(typeFunctionOrTarget: string|((type?: any) => ObjectType<T>), options?: RelationOptions): PropertyDecorator;

/**
 * A many-to-one relation allows creating the type of relation where Entity1 can have a single instance of Entity2, but
 * Entity2 can have multiple instances of Entity1. Entity1 is the owner of the relationship, and stores the id of
 * Entity2 on its side of the relation.
 */
export function ManyToOne<T>(typeFunctionOrTarget: string|((type?: any) => ObjectType<T>),
                             inverseSide?: string|((object: T) => any),
                             options?: RelationOptions): PropertyDecorator;

/**
 * A many-to-one relation allows creating the type of relation where Entity1 can have a single instance of Entity2, but
 * Entity2 can have multiple instances of Entity1. Entity1 is the owner of the relationship, and stores the id of
 * Entity2 on its side of the relation.
 */
export function ManyToOne<T>(typeFunctionOrTarget: string|((type?: any) => ObjectType<T>),
                             inverseSideOrOptions?: string|((object: T) => any)|RelationOptions,
                             options?: RelationOptions): PropertyDecorator {

    return Relation<T>("many-to-one", typeFunctionOrTarget, inverseSideOrOptions, options);
}
