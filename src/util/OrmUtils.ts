import { DeepPartial } from "../common/DeepPartial"
import { ObjectLiteral } from "../common/ObjectLiteral"
import {
    PrimitiveCriteria,
    SinglePrimitiveCriteria,
} from "../common/PrimitiveCriteria"

export class OrmUtils {
    // -------------------------------------------------------------------------
    // Public methods
    // -------------------------------------------------------------------------

    /**
     * Chunks array into pieces.
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
        return array.reduce((groupedArray, value) => {
            const key = propertyCallback(value)
            let grouped = groupedArray.find((i) => i.id === key)
            if (!grouped) {
                grouped = { id: key, items: [] }
                groupedArray.push(grouped)
            }
            grouped.items.push(value)
            return groupedArray
        }, [] as Array<{ id: R; items: T[] }>)
    }

    public static uniq<T>(array: T[], criteria?: (item: T) => unknown): T[]
    public static uniq<T, K extends keyof T>(array: T[], property: K): T[]
    public static uniq<T, K extends keyof T>(
        array: T[],
        criteriaOrProperty?: ((item: T) => unknown) | K,
    ): T[] {
        return array.reduce((uniqueArray, item) => {
            let found: boolean = false
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

    /**
     * Deep Object.assign.
     */
    public static mergeDeep<T>(
        target: T,
        ...sources: (DeepPartial<T> | undefined)[]
    ): T {
        if (!sources.length) {
            return target
        }

        for (const source of sources) {
            OrmUtils.merge(target, source)
        }

        return target
    }

    /**
     * Creates a shallow copy of the object, without invoking the constructor
     */
    public static cloneObject<T extends object>(object: T): T {
        if (object === null || object === undefined) {
            return object
        }

        return Object.assign(
            Object.create(Object.getPrototypeOf(object)) as T,
            object,
        )
    }

    /**
     * Deep compare objects.
     *
     * @see http://stackoverflow.com/a/1144249
     */
    public static deepCompare<T>(...args: T[]): boolean {
        let i: any, l: any, leftChain: any, rightChain: any

        if (args.length < 1) {
            return true // Die silently? Don't know how to handle such case, please help...
            // throw "Need two or more arguments to compare";
        }

        for (i = 1, l = args.length; i < l; i++) {
            leftChain = [] // Todo: this can be cached
            rightChain = []

            if (
                !OrmUtils.compare2Objects(
                    leftChain,
                    rightChain,
                    args[0],
                    args[i],
                )
            ) {
                return false
            }
        }

        return true
    }

    /**
     * Gets deeper value of object.
     */
    public static deepValue(obj: ObjectLiteral, path: string): any {
        const segments = path.split(".")
        for (let i = 0, len = segments.length; i < len; i++) {
            obj = obj[segments[i]]
        }
        return obj
    }

    public static replaceEmptyObjectsWithBooleans(obj: any) {
        for (const key in obj) {
            if (obj[key] && typeof obj[key] === "object") {
                if (Object.keys(obj[key]).length === 0) {
                    obj[key] = true
                } else {
                    OrmUtils.replaceEmptyObjectsWithBooleans(obj[key])
                }
            }
        }
    }

    public static propertyPathsToTruthyObject(paths: string[]) {
        const obj: any = {}
        for (const path of paths) {
            const props = path.split(".")
            if (!props.length) continue

            if (!obj[props[0]] || obj[props[0]] === true) {
                obj[props[0]] = {}
            }
            let recursiveChild = obj[props[0]]
            for (const [key, prop] of props.entries()) {
                if (key === 0) continue

                if (recursiveChild[prop]) {
                    recursiveChild = recursiveChild[prop]
                } else if (key === props.length - 1) {
                    recursiveChild[prop] = {}
                    recursiveChild = null
                } else {
                    recursiveChild[prop] = {}
                    recursiveChild = recursiveChild[prop]
                }
            }
        }
        OrmUtils.replaceEmptyObjectsWithBooleans(obj)
        return obj
    }

    /**
     * Check if two entity-id-maps are the same
     */
    public static compareIds(
        firstId: ObjectLiteral | undefined,
        secondId: ObjectLiteral | undefined,
    ): boolean {
        if (
            firstId === undefined ||
            firstId === null ||
            secondId === undefined ||
            secondId === null
        )
            return false

        // Optimized version for the common case
        if (
            ((typeof firstId.id === "string" &&
                typeof secondId.id === "string") ||
                (typeof firstId.id === "number" &&
                    typeof secondId.id === "number")) &&
            Object.keys(firstId).length === 1 &&
            Object.keys(secondId).length === 1
        ) {
            return firstId.id === secondId.id
        }

        return OrmUtils.deepCompare(firstId, secondId)
    }

    /**
     * Transforms given value into boolean value.
     */
    public static toBoolean(value: any): boolean {
        if (typeof value === "boolean") return value

        if (typeof value === "string") return value === "true" || value === "1"

        if (typeof value === "number") return value > 0

        return false
    }

    /**
     * Checks if two arrays of unique values contain the same values
     */
    public static isArraysEqual<T>(arr1: T[], arr2: T[]): boolean {
        if (arr1.length !== arr2.length) {
            return false
        }

        return arr1.every((element) => arr2.includes(element))
    }

    public static areMutuallyExclusive<T>(...lists: T[][]): boolean {
        const haveSharedObjects = lists.some((list) => {
            const otherLists = lists.filter((otherList) => otherList !== list)
            return list.some((item) =>
                otherLists.some((otherList) => otherList.includes(item)),
            )
        })
        return !haveSharedObjects
    }

    /**
     * Parses the CHECK constraint on the specified column and returns
     * all values allowed by the constraint or undefined if the constraint
     * is not present.
     */
    public static parseSqlCheckExpression(
        sql: string,
        columnName: string,
    ): string[] | undefined {
        const enumMatch = sql.match(
            new RegExp(
                `"${columnName}" varchar CHECK\\s*\\(\\s*"${columnName}"\\s+IN\\s*`,
            ),
        )

        if (enumMatch && enumMatch.index) {
            const afterMatch = sql.substring(
                enumMatch.index + enumMatch[0].length,
            )

            // This is an enum
            // all enum values stored as a comma separated list
            const chars = afterMatch

            /**
             * * When outside quotes: empty string
             * * When inside single quotes: `'`
             */
            let currentQuotes = ""
            let nextValue = ""
            const enumValues: string[] = []
            for (let idx = 0; idx < chars.length; idx++) {
                const char = chars[idx]
                switch (char) {
                    case ",":
                        if (currentQuotes == "") {
                            enumValues.push(nextValue)
                            nextValue = ""
                        } else {
                            nextValue += char
                        }
                        break
                    case "'":
                        if (currentQuotes == char) {
                            const isNextCharQuote = chars[idx + 1] === char
                            if (isNextCharQuote) {
                                // double quote in sql should be treated as a
                                // single quote that's part of the quoted string
                                nextValue += char
                                idx += 1 // skip that next quote
                            } else {
                                currentQuotes = ""
                            }
                        } else {
                            currentQuotes = char
                        }
                        break
                    case ")":
                        if (currentQuotes == "") {
                            enumValues.push(nextValue)
                            return enumValues
                        } else {
                            nextValue += char
                        }
                        break
                    default:
                        if (currentQuotes != "") {
                            nextValue += char
                        }
                }
            }
        }
        return undefined
    }

    /**
     * Checks if given criteria is null or empty.
     */
    public static isCriteriaNullOrEmpty(criteria: unknown): boolean {
        return (
            criteria === undefined ||
            criteria === null ||
            criteria === "" ||
            (Array.isArray(criteria) && criteria.length === 0) ||
            (OrmUtils.isPlainObject(criteria) &&
                Object.keys(criteria).length === 0)
        )
    }

    /**
     * Checks if given criteria is a primitive value.
     * Primitive values are strings, numbers and dates.
     */
    public static isSinglePrimitiveCriteria(
        criteria: unknown,
    ): criteria is SinglePrimitiveCriteria {
        return (
            typeof criteria === "string" ||
            typeof criteria === "number" ||
            criteria instanceof Date
        )
    }

    /**
     * Checks if given criteria is a primitive value or an array of primitive values.
     */
    public static isPrimitiveCriteria(
        criteria: unknown,
    ): criteria is PrimitiveCriteria {
        if (Array.isArray(criteria)) {
            return criteria.every((value) =>
                OrmUtils.isSinglePrimitiveCriteria(value),
            )
        }

        return OrmUtils.isSinglePrimitiveCriteria(criteria)
    }

    // -------------------------------------------------------------------------
    // Private methods
    // -------------------------------------------------------------------------

    private static compare2Objects(
        leftChain: any,
        rightChain: any,
        x: any,
        y: any,
    ) {
        let p

        // remember that NaN === NaN returns false
        // and isNaN(undefined) returns true
        if (Number.isNaN(x) && Number.isNaN(y)) return true

        // Compare primitives and functions.
        // Check if both arguments link to the same object.
        // Especially useful on the step where we compare prototypes
        if (x === y) return true

        // Unequal, but either is null or undefined (use case: jsonb comparison)
        // PR #3776, todo: add tests
        if (x === null || y === null || x === undefined || y === undefined)
            return false

        // Fix the buffer compare bug.
        // See: https://github.com/typeorm/typeorm/issues/3654
        if (
            (typeof x.equals === "function" ||
                typeof x.equals === "function") &&
            x.equals(y)
        )
            return true

        // Works in case when functions are created in constructor.
        // Comparing dates is a common scenario. Another built-ins?
        // We can even handle functions passed across iframes
        if (
            (typeof x === "function" && typeof y === "function") ||
            (x instanceof Date && y instanceof Date) ||
            (x instanceof RegExp && y instanceof RegExp) ||
            (typeof x === "string" && typeof y === "string") ||
            (typeof x === "number" && typeof y === "number")
        )
            return x.toString() === y.toString()

        // At last checking prototypes as good as we can
        if (!(typeof x === "object" && typeof y === "object")) return false

        if (
            Object.prototype.isPrototypeOf.call(x, y) ||
            Object.prototype.isPrototypeOf.call(y, x)
        )
            return false

        if (x.constructor !== y.constructor) return false

        if (x.prototype !== y.prototype) return false

        // Check for infinitive linking loops
        if (leftChain.indexOf(x) > -1 || rightChain.indexOf(y) > -1)
            return false

        // Quick checking of one object being a subset of another.
        // todo: cache the structure of arguments[0] for performance
        for (p in y) {
            if (y.hasOwnProperty(p) !== x.hasOwnProperty(p)) {
                return false
            } else if (typeof y[p] !== typeof x[p]) {
                return false
            }
        }

        for (p in x) {
            if (y.hasOwnProperty(p) !== x.hasOwnProperty(p)) {
                return false
            } else if (typeof y[p] !== typeof x[p]) {
                return false
            }

            switch (typeof x[p]) {
                case "object":
                case "function":
                    leftChain.push(x)
                    rightChain.push(y)

                    if (
                        !OrmUtils.compare2Objects(
                            leftChain,
                            rightChain,
                            x[p],
                            y[p],
                        )
                    ) {
                        return false
                    }

                    leftChain.pop()
                    rightChain.pop()
                    break

                default:
                    if (x[p] !== y[p]) {
                        return false
                    }
                    break
            }
        }

        return true
    }

    // Checks if it's an object made by Object.create(null), {} or new Object()
    private static isPlainObject(item: any) {
        if (item === null || item === undefined) {
            return false
        }

        return !item.constructor || item.constructor === Object
    }

    private static mergeArrayKey(
        target: any,
        key: number,
        value: any,
        memo: Map<any, any>,
    ) {
        // Have we seen this before?  Prevent infinite recursion.
        if (memo.has(value)) {
            target[key] = memo.get(value)
            return
        }

        if (value instanceof Promise) {
            // Skip promises entirely.
            // This is a hold-over from the old code & is because we don't want to pull in
            // the lazy fields.  Ideally we'd remove these promises via another function first
            // but for now we have to do it here.
            return
        }

        if (!OrmUtils.isPlainObject(value) && !Array.isArray(value)) {
            target[key] = value
            return
        }

        if (!target[key]) {
            target[key] = Array.isArray(value) ? [] : {}
        }

        memo.set(value, target[key])
        OrmUtils.merge(target[key], value, memo)
        memo.delete(value)
    }

    private static mergeObjectKey(
        target: any,
        key: string,
        value: any,
        memo: Map<any, any>,
    ) {
        // Have we seen this before?  Prevent infinite recursion.
        if (memo.has(value)) {
            Object.assign(target, { [key]: memo.get(value) })
            return
        }

        if (value instanceof Promise) {
            // Skip promises entirely.
            // This is a hold-over from the old code & is because we don't want to pull in
            // the lazy fields.  Ideally we'd remove these promises via another function first
            // but for now we have to do it here.
            return
        }

        if (!OrmUtils.isPlainObject(value) && !Array.isArray(value)) {
            Object.assign(target, { [key]: value })
            return
        }

        if (!target[key]) {
            Object.assign(target, { [key]: Array.isArray(value) ? [] : {} })
        }

        memo.set(value, target[key])
        OrmUtils.merge(target[key], value, memo)
        memo.delete(value)
    }

    private static merge<T>(
        target: T,
        source: DeepPartial<T> | undefined,
        memo: Map<any, any> = new Map(),
    ): void {
        if (OrmUtils.isPlainObject(target) && OrmUtils.isPlainObject(source)) {
            for (const [key, value] of Object.entries(
                source as ObjectLiteral,
            )) {
                if (key === "__proto__") continue
                OrmUtils.mergeObjectKey(target, key, value, memo)
            }
        }

        if (Array.isArray(target) && Array.isArray(source)) {
            for (let key = 0; key < source.length; key++) {
                OrmUtils.mergeArrayKey(target, key, source[key], memo)
            }
        }
    }
}
