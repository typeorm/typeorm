/**
 * A single property handler for FindOptionsRelations.
 */
export type FindOptionsApplyFilterConditionsProperty<Property> =
    Property extends Promise<infer I>
        ? FindOptionsApplyFilterConditionsProperty<NonNullable<I>> | boolean
        : Property extends Array<infer I>
        ? FindOptionsApplyFilterConditionsProperty<NonNullable<I>> | boolean
        : Property extends object
        ? FindOptionsApplyFilterConditions<Property> | boolean
        : boolean

/**
 * Relations find options.
 */
export type FindOptionsApplyFilterConditions<Entity> = {
    [P in keyof Entity]?: P extends "toString"
        ? unknown
        : FindOptionsApplyFilterConditionsProperty<NonNullable<Entity[P]>>
}
