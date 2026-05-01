import { DateUtils } from "../../../util/DateUtils"
import type { ColumnValueHandler } from "../ColumnValueHandler"

/** Compares simple-json column values by their JSON.stringify output. */
export const SimpleJsonValueHandler: ColumnValueHandler<object | string> = {
    normalize: (v) => v,
    areEqual: (a, b) =>
        DateUtils.simpleJsonToString(a) === DateUtils.simpleJsonToString(b),
}
