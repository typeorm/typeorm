/**
 * Expand entity properties.
 */
export type EntityProperty<Entity> = Exclude<keyof Entity, symbol | number>;
