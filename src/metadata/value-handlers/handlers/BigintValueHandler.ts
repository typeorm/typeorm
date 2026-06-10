import type { ColumnValueHandler } from "../ColumnValueHandler"

/** Normalizes bigint PKs to string to prevent precision loss. */
export const BigintValueHandler: ColumnValueHandler = {
    normalize(value) {
        if (value == null) return value
        if (
            typeof value === "number" ||
            typeof value === "bigint" ||
            typeof value === "string"
        )
            return String(value)
        return value
    },
    areEqual: (a, b) => a === b,
}
