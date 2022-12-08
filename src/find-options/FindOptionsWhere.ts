import { FindOperator } from "./FindOperator"
import { ObjectID } from "../driver/mongodb/typings"
import { EqualOperator } from "./EqualOperator"

/**
 * A single property handler for FindOptionsWhere.
 */
export type FindOptionsWhereProperty<
    Property,
    Original = Property,
> = Property extends Promise<infer I>
    ? FindOptionsWhereProperty<NonNullable<I>>
    : Property extends Array<infer I>
    ? FindOptionsWhereProperty<NonNullable<I>>
    : Property extends Function
    ? never
    : Property extends Buffer
    ? Property | FindOperator<Property> | FindOperator<Original>
    : Property extends Date
    ? Property | FindOperator<Property> | FindOperator<Original>
    : Property extends ObjectID
    ? Property | FindOperator<Property> | FindOperator<Original>
    : Property extends string
    ? Property | FindOperator<Property> | FindOperator<Original>
    : Property extends number
    ? Property | FindOperator<Property> | FindOperator<Original>
    : Property extends boolean
    ? Property | FindOperator<Property> | FindOperator<Original>
    : Property extends object
    ?
          | FindOptionsWhere<Property>
          | FindOptionsWhere<Original>
          | FindOptionsWhere<Property>[]
          | EqualOperator<Property>
          | EqualOperator<Original>
          | FindOperator<any>
          | boolean
    : Property | FindOperator<Property> | FindOperator<Original>

/**
 * Used for find operations.
 */
export type FindOptionsWhere<Entity> = {
    [P in keyof Entity]?: P extends "toString"
        ? unknown
        : FindOptionsWhereProperty<NonNullable<Entity[P]>>
}
