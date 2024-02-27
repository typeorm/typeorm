import { FindOperator } from "./FindOperator"
import { ObjectId } from "../driver/mongodb/typings"
import { EqualOperator } from "./EqualOperator"

/**
 * A single property handler for FindOptionsWhere.
 */
export type FindOptionsWhereProperty<
    Property,
> = [Property] extends [Promise<infer I>]
    ? FindOptionsWhereProperty<NonNullable<I>>
    : [Property] extends [Array<infer I>]
    ? FindOptionsWhereProperty<NonNullable<I>>
    : [Property] extends [Function]
    ? never
    : [Property] extends [Buffer]
    ? Property | FindOperator<Property>
    : [Property] extends [Date]
    ? Property | FindOperator<Property>
    : [Property] extends [ObjectId]
    ? Property | FindOperator<Property>
    : [Property] extends [string]
    ? Property | FindOperator<Property>
    : [Property] extends [number]
    ? Property | FindOperator<Property>
    : [Property] extends [boolean]
    ? Property | FindOperator<Property>
    : [Property] extends [object]
    ?
          | FindOptionsWhere<Property>
          | FindOptionsWhere<Property>[]
          | EqualOperator<Property>
          | FindOperator<any>
          | boolean
          | Property
    : Property | FindOperator<Property>

/**
 * Used for find operations.
 */
export type FindOptionsWhere<Entity> = {
    [P in keyof Entity]?: P extends "toString"
        ? unknown
        : FindOptionsWhereProperty<NonNullable<Entity[P]>>
}
