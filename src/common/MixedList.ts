/**
 * List of T-s passed as an array or object map.
 *
 * Example usage: entities as an array of imported using import * as syntax.
 */
export type MixedList<T> = T[] | { [key: string]: T }

export function isEmpty<T>(list: MixedList<T>): boolean {
    if (Array.isArray(list)) {
        // Check if it's an empty array
        return list.length === 0
    } else {
        // Check if it's an empty object
        return Object.keys(list).length === 0
    }
}
