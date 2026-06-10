import { DateUtils } from "../../../util/DateUtils"
import type { ColumnValueHandler } from "../ColumnValueHandler"

/** Compares datetime/timestamp column values by their UTC datetime string representation. */
export const DateTimeValueHandler: ColumnValueHandler<
    Date | string,
    Date | string
> = {
    normalize: (v) => v,
    areEqual: (a, b) =>
        DateUtils.mixedDateToUtcDatetimeString(a) ===
        DateUtils.mixedDateToUtcDatetimeString(b),
}
