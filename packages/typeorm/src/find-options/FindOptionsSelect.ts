import type { ObjectId } from "../driver/mongodb/typings"

/**
 * A single property handler for FindOptionsSelect.
 */
export type FindOptionsSelectProperty<Property> =
    Property extends Promise<infer I>
        ? FindOptionsSelectProperty<I> | boolean
        : Property extends Array<infer I>
          ? FindOptionsSelectProperty<I> | boolean
          : Property extends string
            ? boolean
            : Property extends number
              ? boolean
              : Property extends boolean
                ? boolean
                : Property extends Function
                  ? never
                  : Property extends Uint8Array
                    ? boolean
                    : Property extends Date
                      ? boolean
                      : Property extends ObjectId
                        ? boolean
                        : Property extends object
                          ? FindOptionsSelect<Property> | boolean
                          : boolean

/**
 * Select find options.
 */
export type FindOptionsSelect<Entity> = {
    [P in keyof Entity]?: P extends "toString"
        ? unknown
        : FindOptionsSelectProperty<NonNullable<Entity[P]>>
}
