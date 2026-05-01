import type { ColumnValueHandler } from "./ColumnValueHandler"
import { isUint8Array, areUint8ArraysEqual } from "../../util/Uint8ArrayUtils"

/** Fallback handler: === equality with Uint8Array and .equals() support. */
const defaultHandler: ColumnValueHandler<unknown> = {
    normalize: (v) => v,
    areEqual(a, b) {
        if (a === b) return true
        if (isUint8Array(a) && isUint8Array(b)) return areUint8ArraysEqual(a, b)
        if (
            a != null &&
            typeof a === "object" &&
            "equals" in a &&
            typeof a.equals === "function"
        )
            return a.equals(b)
        return false
    },
}

/** Static utilities for column value normalization and comparison. */
export class ValueHandlers {
    /** Fallback handler for column types without specialized normalization. */
    static readonly defaultHandler: ColumnValueHandler<unknown> = defaultHandler

    /**
     * Canonicalize a value using the given handler; array-aware.
     *
     * @param handler - Resolved value handler for this column.
     * @param value - Raw value to normalize.
     * @param isArray - Whether the column is an array column.
     * @returns The normalized value.
     */
    static normalize(
        handler: ColumnValueHandler,
        value: unknown,
        isArray: boolean,
    ): unknown {
        if (value == null) return value
        if (isArray && Array.isArray(value))
            return value.map((v) => handler.normalize(v))
        return handler.normalize(value)
    }

    /**
     * Type-aware equality check; normalizes both inputs before comparison.
     *
     * @param handler - Resolved value handler for this column.
     * @param a - First value to compare.
     * @param b - Second value to compare.
     * @param isArray - Whether the column is an array column.
     * @returns True if semantically equal.
     */
    static areEqual(
        handler: ColumnValueHandler,
        a: unknown,
        b: unknown,
        isArray: boolean,
    ): boolean {
        const na = ValueHandlers.normalize(handler, a, isArray)
        const nb = ValueHandlers.normalize(handler, b, isArray)
        if (na === nb) return true
        if (na == null || nb == null) return na === nb
        if (isArray) {
            if (!Array.isArray(na) || !Array.isArray(nb)) return false
            if (na.length !== nb.length) return false
            return na.every((v: unknown, i: number) =>
                handler.areEqual(v, nb[i]),
            )
        }
        return handler.areEqual(na, nb)
    }
}
