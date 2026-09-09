import type { ObjectId } from "../driver/mongodb/typings"

/**
 * A single property handler for FindOptionsRelations.
 */
export type FindOptionsRelationsProperty<Property> =
    Property extends Promise<infer I>
        ? FindOptionsRelationsProperty<NonNullable<I>> | boolean
        : Property extends Array<infer I>
          ? FindOptionsRelationsProperty<NonNullable<I>> | boolean
          : Property extends string
            ? never
            : Property extends number
              ? never
              : Property extends boolean
                ? never
                : Property extends Function
                  ? never
                  : Property extends Uint8Array
                    ? never
                    : Property extends Date
                      ? never
                      : Property extends ObjectId
                        ? never
                        : Property extends object
                          ? FindOptionsRelations<Property> | boolean
                          : boolean

/**
 * Relations find options.
 */
export type FindOptionsRelations<Entity> = {
    [P in keyof Entity]?: P extends "toString"
        ? unknown
        : FindOptionsRelationsProperty<NonNullable<Entity[P]>>
}
