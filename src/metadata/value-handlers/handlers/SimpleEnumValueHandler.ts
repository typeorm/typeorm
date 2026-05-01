import { DateUtils } from "../../../util/DateUtils"
import type { ColumnValueHandler } from "../ColumnValueHandler"

/** Compares simple-enum column values by their string representation. */
export const SimpleEnumValueHandler: ColumnValueHandler<string | string[]> = {
    normalize: (v) => v,
    areEqual: (a, b) =>
        DateUtils.simpleEnumToString(a) === DateUtils.simpleEnumToString(b),
}
