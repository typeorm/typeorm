import type { ColumnMetadata } from "../ColumnMetadata"
import type { Driver } from "../../driver/Driver"
import type { ColumnValueHandler } from "./ColumnValueHandler"
import { BigintValueHandler } from "./handlers/BigintValueHandler"
import { DateValueHandler } from "./handlers/DateValueHandler"
import { TimeValueHandler } from "./handlers/TimeValueHandler"
import { DateTimeValueHandler } from "./handlers/DateTimeValueHandler"
import { JsonValueHandler } from "./handlers/JsonValueHandler"
import { SimpleArrayValueHandler } from "./handlers/SimpleArrayValueHandler"
import { SimpleEnumValueHandler } from "./handlers/SimpleEnumValueHandler"
import { SimpleJsonValueHandler } from "./handlers/SimpleJsonValueHandler"
import { ValueHandlers } from "./ValueHandlers"

/** Function signature for resolving a value handler from column metadata. */
export type ValueHandlerResolver = (
    column: ColumnMetadata,
    driver?: Driver,
) => ColumnValueHandler

/**
 * Default resolver: driver override -> bigint -> type switch -> fallback.
 *
 * @param column - Column metadata to resolve a handler for.
 * @param driver - Optional driver for driver-specific overrides.
 * @returns The resolved handler.
 */
export function resolveValueHandler(
    column: ColumnMetadata,
    driver?: Driver,
): ColumnValueHandler {
    const override = driver?.resolveValueHandler?.(column)
    if (override) return override

    if (
        column.type === "bigint" &&
        (column.generationStrategy === "increment" ||
            column.generationStrategy === "rowid")
    )
        return BigintValueHandler

    // Date constructor used as column type (e.g. @Column({ type: Date }))
    if (column.type === Date) return DateTimeValueHandler

    switch (column.type) {
        case "date":
            return DateValueHandler
        case "time":
        case "time with time zone":
        case "time without time zone":
        case "timetz":
            return TimeValueHandler
        case "datetime":
        case "datetime2":
        case "timestamp":
        case "timestamp without time zone":
        case "timestamp with time zone":
        case "timestamp with local time zone":
        case "timestamptz":
            return DateTimeValueHandler
        case "json":
        case "jsonb":
            return JsonValueHandler
        case "simple-array":
            return SimpleArrayValueHandler
        case "simple-enum":
            return SimpleEnumValueHandler
        case "simple-json":
            return SimpleJsonValueHandler
        default:
            return ValueHandlers.defaultHandler
    }
}
