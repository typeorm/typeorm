import type { DeepPartial } from "../common/DeepPartial"
import type { ObjectLiteral } from "../common/ObjectLiteral"
import type {
    PrimitiveCriteria,
    SinglePrimitiveCriteria,
} from "../common/PrimitiveCriteria"
import type { InvalidFindOptionsWhereBehavior } from "../driver/types/InvalidFindOptionsWhereBehavior"
import { TypeORMError } from "../error"
import { IsNull } from "../find-options/operator/IsNull"
import { areUint8ArraysEqual, isUint8Array } from "./Uint8ArrayUtils"

export class OrmUtils {
    // -------------------------------------------------------------------------
    // Public methods
    // -------------------------------------------------------------------------

    /**
     * Chunks array into pieces.
     *
     * @param array
     * @param size
     */
    public static chunk<T>(array: T[], size: number): T[][] {
        return Array.from(Array(Math.ceil(array.length / size)), (_, i) => {
            return array.slice(i * size, i * size + size)
        })
    }

    public static splitClassesAndStrings<T>(
        classesAndStrings: (string | T)[],
    ): [T[], string[]] {
        return [
            classesAndStrings.filter(
                (cls): cls is T => typeof cls !== "string",
            ),
            classesAndStrings.filter(
                (str): str is string => typeof str === "string",
            ),
        ]
    }

    public static groupBy<T, R>(
        array: T[],
        propertyCallback: (item: T) => R,
    ): { id: R; items: T[] }[] {
        return array.reduce(
            (groupedArray, value) => {
                const key = propertyCallback(value)
                let grouped = groupedArray.find((i) => i.id === key)
                if (!grouped) {
                    grouped = { id: key, items: [] }
                    groupedArray.push(grouped)
                }
                grouped.items.push(value)
                return groupedArray
            },
            [] as Array<{ id: R; items: T[] }>,
        )
    }

    public static uniq<T>(array: T[], criteria?: (item: T) => unknown): T[]
    public static uniq<T, K extends keyof T>(array: T[], property: K): T[]
    public static uniq<T, K extends keyof T>(
        array: T[],
        criteriaOrProperty?: ((item: T) => unknown) | K,
    ): T[] {
        return array.reduce((uniqueArray, item) => {
            let found: boolean
            if (typeof criteriaOrProperty === "function") {
                const itemValue = criteriaOrProperty(item)
                found = !!uniqueArray.find(
                    (uniqueItem) =>
                        criteriaOrProperty(uniqueItem) === itemValue,
                )
            } else if (typeof criteriaOrProperty === "string") {
                found = !!uniqueArray.find(
                    (uniqueItem) =>
                        uniqueItem[criteriaOrProperty] ===
                        item[criteriaOrProperty],
                )
            } else {
                found = uniqueArray.indexOf(item) !== -1
            }
            if (!found) uniqueArray.push(item)
            return uniqueArray
        }, [] as T[])
    }

    public static isObject(item: unknown): item is Object {
        return item !== null && typeof item === "object"
    }

    /**
     * Deep Object.assign.
     *
     * @see https://goo.gl/VwXw3G
     */
    public static mergeDeep<T extends ObjectLiteral>(
        target: T,
        ...sources: ObjectLiteral[]
    ): T
    public static mergeDeep<T>(target: T, ...sources: any[]): T
    public static mergeDeep<T>(target: T, ...sources: any[]): T {
        if (!sources.length) {
            return target
        }

        const source = sources.shift()

        if (this.isObject(target) && this.isObject(source)) {
            for (const key in source) {
                const value = source[key]
                if (value instanceof Promise) continue

                if (this.isObject(value) && !Array.isArray(value)) {
                    if (!(target as any)[key])
                        Object.assign(target, { [key]: Object.create(null) })
                    this.mergeDeep((target as any)[key], value)
                } else {
                    Object.assign(target, { [key]: value })
                }
            }
        }

        return this.mergeDeep(target, ...sources)
    }

    /**
     * Create a deep copy of a plain object or array.
     *
     * Arrays are copied in-place, but any nested objects
     * inside them are also deep cloned.
     *
     * References instance of objects are copied as references.
     */
    public static deepCopy<T>(obj: T): T {
        if (obj === null || typeof obj !== "object") {
            return obj
        }

        // Not needed to deep copy Date and Uint8Array, because
        // it is not a plain object and can't be modified
        if (obj instanceof Date || isUint8Array(obj)) {
            return obj
        }

        if (Array.isArray(obj)) {
            return obj.map((item) => this.deepCopy(item)) as any
        }

        // Only deep copy plain objects
        if (!this.isPlainObject(obj)) {
            return obj
        }

        const result: any = {}
        for (const key of Object.keys(obj)) {
            result[key] = this.deepCopy(obj[key as keyof T])
        }
        return result as T
    }

    public static isPlainObject(obj: any): boolean {
        if (obj === null || typeof obj !== "object") {
            return false
        }

        const proto = Object.getPrototypeOf(obj)
        return proto === null || proto === Object.prototype
    }

    /**
     * Compares two objects.
     * Function compares object's public properties only.
     */
    public static compare(obj1: any, obj2: any): boolean {
        if (obj1 == null || obj2 == null) return false

        const obj1Keys = Object.keys(obj1)
        const obj2Keys = Object.keys(obj2)

        if (obj1Keys.length !== obj2Keys.length) return false

        return obj1Keys.every((key) => obj1[key] === obj2[key])
    }

    /**
     * Checks if value is a primitive type.
     */
    public static isPrimitive(value: any): boolean {
        return ["number", "boolean", "string", "symbol"].indexOf(
            typeof value,
        ) >= 0
    }

    static isSinglePrimitiveCriteria<T>(
        criteria: PrimitiveCriteria<T>,
    ): criteria is SinglePrimitiveCriteria<T> {
        return !Array.isArray(criteria)
    }

    /**
     * Converts null to IsNull operator and handles undefined values
     * based on the provided options or datasource options.
     * By default, null and undefined values are treated as errors.
     *
     * @param criteria - The search criteria to normalize
     * @param options - Optional behavior settings for null/undefined handling
     * @returns The normalized criteria
     */
    static normalizeWhereCriteria<T extends ObjectLiteral>(
        criteria: T,
        options?: {
            null?: InvalidFindOptionsWhereBehavior
            undefined?: InvalidFindOptionsWhereBehavior
        },
    ): T {
        const nullBehavior = options?.null ?? "throw"
        const undefinedBehavior = options?.undefined ?? "throw"

        const processValue = (
            obj: ObjectLiteral,
            key: string,
        ): ObjectLiteral | null => {
            const value = obj[key]

            if (value === null) {
                if (nullBehavior === "throw") {
                    throw new TypeORMError(
                        `Using \"null\" value in where criteria is not supported. ` +
                            `Use \"IsNull()\" operator instead, or configure invalidFindOptionsWhere ` +
                            `in data source options to customize this behavior.`,
                    )
                } else if (nullBehavior === "ignore") {
                    return null // Signal to exclude this key
                } else if (nullBehavior === "allow") {
                    return { [key]: IsNull() }
                }
            }

            if (value === undefined) {
                if (undefinedBehavior === "throw") {
                    throw new TypeORMError(
                        `Using \"undefined\" value in where criteria is not supported. ` +
                            `If you want to make a property optional, configure invalidFindOptionsWhere ` +
                            `in data source options to customize this behavior.`,
                    )
                } else {
                    // Both "ignore" and "allow" behaviors exclude undefined values
                    return null // Signal to exclude this key
                }
            }

            // Handle nested objects recursively
            if (
                value !== null &&
                typeof value === "object" &&
                !Array.isArray(value) &&
                this.isPlainObject(value)
            ) {
                const normalized = this.normalizeWhereCriteria(value, options)
                return { [key]: normalized }
            }

            return { [key]: value }
        }

        const result = {} as T
        for (const key of Object.keys(criteria)) {
            const processed = processValue(criteria, key)
            if (processed !== null) {
                Object.assign(result, processed)
            }
        }
        return result
    }

    /**
     * Returns the difference between two arrays.
     */
    public static difference<T = any>(arr1: T[], arr2: T[]): T[] {
        return arr1.filter((a) => !arr2.includes(a))
    }

    /**
     * Escapes special characters (^$\\.*+?()[]{}|) in a given string
     */
    public static escapeRegExp(str: string): string {
        return str.replace(/[\\-+\\-\\[\\]\\{\\}\\(\\)\\*\\+\\?\\.\\\\\\^\\$\\|]/g, "\\$&")
    }

    /**
     * Converts a RegExp to a string representation that can be used in SQL.
     */
    public static regexpToString(regexp: RegExp): string {
        // remove / and / or /i in begin and end
        // because different database have different requirements for regex
        // so we will need to format it accordingly
        return regexp.source
    }

    /**
     * Returns the first item of the array, or `undefined` if the array is empty.
     */
    public static first<T = any>(array: T[]): T | undefined {
        return array.length > 0 ? array[0] : undefined
    }

    public static replaceEmptyObjectsWithBooleans<T>(
        object: DeepPartial<T>,
    ): DeepPartial<T> {
        for (const key in object) {
            if (!object.hasOwnProperty(key)) continue

            const value = object[key]

            if (typeof value === "object" && value !== null) {
                if (Object.keys(value).length === 0) {
                    ;(object as any)[key] = true
                } else {
                    this.replaceEmptyObjectsWithBooleans(value as DeepPartial<T>)
                }
            }
        }

        return object
    }

    /**
     * Compares two values for equality, handling Uint8Array
     */
    public static valuesEqual(a: any, b: any): boolean {
        if (isUint8Array(a) && isUint8Array(b)) {
            return areUint8ArraysEqual(a, b)
        }

        return a === b
    }
}
