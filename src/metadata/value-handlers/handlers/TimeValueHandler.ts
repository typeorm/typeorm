import { DateUtils } from "../../../util/DateUtils"
import type { ColumnValueHandler } from "../ColumnValueHandler"

/** Compares time column values by their time-only string representation. */
export const TimeValueHandler: ColumnValueHandler<
    Date | string,
    Date | string
> = {
    normalize: (v) => v,
    areEqual: (a, b) =>
        DateUtils.mixedDateToTimeString(a) ===
        DateUtils.mixedDateToTimeString(b),
}
