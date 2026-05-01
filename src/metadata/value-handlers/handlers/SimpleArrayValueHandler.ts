import { DateUtils } from "../../../util/DateUtils"
import type { ColumnValueHandler } from "../ColumnValueHandler"

/** Compares simple-array column values by their comma-joined string representation. */
export const SimpleArrayValueHandler: ColumnValueHandler<unknown[] | string> = {
    normalize: (v) => v,
    areEqual: (a, b) =>
        DateUtils.simpleArrayToString(a) === DateUtils.simpleArrayToString(b),
}
