import { ObjectType, RelationOptions } from "../../";
/**
 * Many-to-one relation allows to create type of relation when Entity1 can have single instance of Entity2, but
 * Entity2 can have a multiple instances of Entity1. Entity1 is an owner of the relationship, and storages Entity2 id
 * on its own side.
 */
export declare function ManyToOne<T>(typeFunctionOrTarget: string | ((type?: any) => ObjectType<T>), options?: RelationOptions): Function;
/**
 * Many-to-one relation allows to create type of relation when Entity1 can have single instance of Entity2, but
 * Entity2 can have a multiple instances of Entity1. Entity1 is an owner of the relationship, and storages Entity2 id
 * on its own side.
 */
export declare function ManyToOne<T>(typeFunctionOrTarget: string | ((type?: any) => ObjectType<T>), inverseSide?: string | ((object: T) => any), options?: RelationOptions): Function;
