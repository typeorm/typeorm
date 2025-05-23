/**
 * Global TypeORM settings that can be extended via declaration merging.
 * Used to configure type-level behavior that should match runtime configuration.
 *
 * @example
 * ```typescript
 * // Runtime configuration
 * const dataSource = new DataSource({
 *   findWhereBehavior: { null: 'sql-null', undefined: 'throw' }
 * })
 *
 * // TypeScript configuration
 * declare module 'typeorm' {
 *   interface TypeORMSettings {
 *     allowNullableWhere: true
 *   }
 * }
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface TypeORMSettings {}
