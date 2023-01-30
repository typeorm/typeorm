import { FindOperator } from "./FindOperator"
import { ObjectID } from "../driver/mongodb/typings"
import { EqualOperator } from "./EqualOperator"

/**
 * A single property handler for FindOptionsWhere.
 */
export type FindOptionsWhereProperty<Property> = FindOptionsWherePropertyInternal<Property, FindOperator<Property>>;

type FindOptionsWherePropertyInternal<Property, PropertyOperator> = Property extends Promise<
    infer I
>
    ? FindOptionsWhereProperty<I & {}>
    : Property extends Array<infer I>
    ? FindOptionsWhereProperty<I & {}>
    : Property extends Function
    ? never
    : Property extends Buffer
    ? Property | PropertyOperator
    : Property extends Date
    ? Property | PropertyOperator
    : Property extends ObjectID
    ? Property | PropertyOperator
    : Property extends string
    ? Property | PropertyOperator
    : Property extends number
    ? Property | PropertyOperator
    : Property extends boolean
    ? Property | PropertyOperator
    : Property extends object
    ?
          | FindOptionsWhere<Property>
          | FindOptionsWhere<Property>[]
          | EqualOperator<Property>
          | FindOperator<any>
          | boolean
    : Property | PropertyOperator

/**
 * Used for find operations.
 */
export type FindOptionsWhere<Entity> = {
    [P in keyof Entity]?: P extends "toString"
        ? unknown
        : FindOptionsWhereProperty<Entity[P] & {}>
}
