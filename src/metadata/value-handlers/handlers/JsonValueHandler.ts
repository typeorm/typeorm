import { OrmUtils } from "../../../util/OrmUtils"
import type { ColumnValueHandler } from "../ColumnValueHandler"

/** Compares json/jsonb column values using deep structural equality. */
export const JsonValueHandler: ColumnValueHandler<object> = {
    normalize: (v) => v,
    areEqual: (a, b) => OrmUtils.deepCompare(a, b),
}
