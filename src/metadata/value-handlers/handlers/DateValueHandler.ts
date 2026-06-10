import { DateUtils } from "../../../util/DateUtils"
import type { ColumnValueHandler } from "../ColumnValueHandler"

/** Compares date column values by their date-only string representation. */
export const DateValueHandler: ColumnValueHandler<
    Date | string,
    Date | string
> = {
    normalize: (v) => v,
    areEqual: (a, b) =>
        DateUtils.mixedDateToDateString(a) ===
        DateUtils.mixedDateToDateString(b),
}
