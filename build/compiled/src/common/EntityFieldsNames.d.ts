/**
 * Interface of the entity fields names only (without functions)
 */
export type EntityFieldsNames<Entity = any> = {
    [P in keyof Entity]: Entity[P] extends Function ? never : P;
}[keyof Entity];
