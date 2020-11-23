import {ObjectType, RelationOptions} from "../../";
import {Relation} from "./Relation";

/**
 * One-to-one relation allows to create direct relation between two entities. Entity1 have only one Entity2.
 * Entity1 is an owner of the relationship, and storages Entity1 id on its own side.
 */
export function OneToOne<T>(typeFunctionOrTarget: string|((type?: any) => ObjectType<T>),
                            options?: RelationOptions): PropertyDecorator;

/**
 * One-to-one relation allows to create direct relation between two entities. Entity1 have only one Entity2.
 * Entity1 is an owner of the relationship, and storages Entity1 id on its own side.
 */
export function OneToOne<T>(typeFunctionOrTarget: string|((type?: any) => ObjectType<T>),
                            inverseSide?: string|((object: T) => any),
                            options?: RelationOptions): PropertyDecorator;

/**
 * One-to-one relation allows to create direct relation between two entities. Entity1 have only one Entity2.
 * Entity1 is an owner of the relationship, and storages Entity1 id on its own side.
 */
export function OneToOne<T>(typeFunctionOrTarget: string|((type?: any) => ObjectType<T>),
                            inverseSideOrOptions?: string|((object: T) => any)|RelationOptions,
                            options?: RelationOptions): PropertyDecorator {
    return Relation<T>("one-to-one", typeFunctionOrTarget, inverseSideOrOptions, options);
}
