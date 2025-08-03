declare const relationSymbol: unique symbol

/**
 * Wrapper type for relation type definitions in entities.
 * Used to circumvent ESM modules circular dependency issue caused by reflection metadata saving the type of the property.
 *
 * Usage example:
 * @Entity()
 * export default class User {
 *
 *     @OneToOne(() => Profile, profile => profile.user)
 *     profile: Relation<Profile>;
 *
 * }
 */
export type Relation<T> = T & { [relationSymbol]?: true }

type IsRelation<T> = T extends { [relationSymbol]?: true } ? true : false
type GetEntityRelationKeys<T> = {
    [K in keyof T]: IsRelation<T[K]> extends true ? K : never
}[keyof T]

/**
 * Omit relations from an object.
 * This is useful when you want to create a new object without the relations.
 *
 * Usage example:
 *
 * ```ts
 * \@Entity()
 * export default class User {
 *   // ... other properties
 *
 *   \@OneToOne(() => Profile, profile => profile.user)
 *   profile: Relation<Profile>;
 *
 *   constructor(user: OmitRelations<User>) {
 *     Object.assign(this, user);
 *   }
 * }
 * ```
 */
export type OmitRelations<T> = Omit<T, GetEntityRelationKeys<T>>
