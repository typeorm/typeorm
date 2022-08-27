/**
 * This empty interface can be extended by end users
 * to add their custom functionality in type-safe way
 * Eg.
 * ```ts
 * declare module 'typeorm' {
 *     interface CustomEntityMetadata {
 *         myTriggerSystem: EntityTriggers[];
 *     }
 * }
 * ```
 */

export interface CustomEntityMetadata {}
