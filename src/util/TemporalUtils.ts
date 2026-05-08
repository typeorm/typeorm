import type { ColumnType } from "../driver/types/ColumnTypes"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const T = (): any => (globalThis as any).Temporal

/**
 * Cross-cutting Temporal helpers: runtime detection, type-to-kind inference,
 * and a global type guard that ORs all per-kind matchers.
 *
 * Per-kind conversion lives in the per-type Utils classes below
 * (`InstantUtils`, `ZonedDateTimeUtils`, etc.).
 */
export class TemporalUtils {
    static isSupported(): boolean {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return typeof (globalThis as any).Temporal !== "undefined"
    }

    static inferKindFromReflectType(reflectType: any): ColumnType | undefined {
        if (!this.isSupported() || reflectType == null) return undefined
        const t = T()
        if (reflectType === t.ZonedDateTime) return "timestamptz"
        if (reflectType === t.PlainDateTime) return "timestamp"
        if (reflectType === t.PlainDate) return "date"
        if (reflectType === t.PlainTime) return "time"
        if (reflectType === t.Duration) return "interval"
        return undefined
    }
}

/**
 * Converts to/from `Temporal.ZonedDateTime`. Used when a `timestamptz` column
 * should hydrate in a specific IANA timezone instead of as a bare instant.
 */
export class ZonedDateTimeUtils {
    static toTemporal(
        value: Date | string | null | undefined,
        timeZone: string = "UTC",
    ): Temporal.ZonedDateTime | null {
        if (value === null || value === undefined) return null

        const t = T()
        if (value instanceof Date)
            return t.Instant.fromEpochMilliseconds(
                value.getTime(),
            ).toZonedDateTimeISO(timeZone)
        const valueString =
            typeof value === "string" ? value.replace(" ", "T") : String(value)
        return t.Instant.from(valueString).toZonedDateTimeISO(timeZone)
    }

    static fromTemporal(value: Temporal.ZonedDateTime): string {
        return value.toInstant().toString()
    }
}

/**
 * Converts to/from `Temporal.PlainDateTime`. Used for `timestamp without time
 * zone` columns. `Date` inputs are read as wall-clock components in the
 * runtime's local timezone (matching what the `pg` driver returns).
 */
export class PlainDateTimeUtils {
    static toTemporal(
        value: Date | string | null | undefined,
    ): Temporal.PlainDateTime | null {
        if (value === null || value === undefined) return null

        const t = T()
        if (value instanceof Date) {
            return t.PlainDateTime.from({
                year: value.getFullYear(),
                month: value.getMonth() + 1,
                day: value.getDate(),
                hour: value.getHours(),
                minute: value.getMinutes(),
                second: value.getSeconds(),
                millisecond: value.getMilliseconds(),
            })
        }
        return t.PlainDateTime.from(
            typeof value === "string" ? value.replace(" ", "T") : String(value),
        )
    }

    static fromTemporal(value: Temporal.PlainDateTime): string {
        return value.toString()
    }
}

/**
 * Converts to/from `Temporal.PlainDate`. Used for `date` columns.
 */
export class PlainDateUtils {
    static toTemporal(
        value: Date | string | null | undefined,
    ): Temporal.PlainDate | null {
        if (value === null || value === undefined) return null

        const t = T()
        if (value instanceof Date) {
            return t.PlainDate.from({
                year: value.getUTCFullYear(),
                month: value.getUTCMonth() + 1,
                day: value.getUTCDate(),
            })
        }
        return t.PlainDate.from(String(value))
    }

    static fromTemporal(value: Temporal.PlainDate): string {
        return value.toString()
    }
}

/**
 * Converts to/from `Temporal.PlainTime`. Used for `time without time zone`
 * columns.
 */
export class PlainTimeUtils {
    static toTemporal(
        value: string | null | undefined,
    ): Temporal.PlainTime | null {
        if (value === null || value === undefined) return null

        const t = T()
        return t.PlainTime.from(String(value))
    }

    static fromTemporal(value: Temporal.PlainTime): string {
        return value.toString()
    }
}

/**
 * Converts to/from `Temporal.Duration`. Used for `interval` columns.
 */
export class DurationUtils {
    static toTemporal(
        value: string | object | null | undefined,
    ): Temporal.Duration | null {
        if (value === null || value === undefined) return null

        const t = T()
        // The `pg` driver parses `interval` (OID 1186) into a
        // `postgres-interval` object whose default `toString()` returns the
        // Postgres human-readable form ("1 day 04:05:06"), which
        // `Temporal.Duration.from` cannot parse. Prefer `toISOString()` when
        // present, then fall back to a plain components object, and finally
        // to string coercion for already-ISO inputs.
        if (typeof value === "object") {
            const obj = value as {
                toISOString?: () => string
                years?: number
                months?: number
                days?: number
                hours?: number
                minutes?: number
                seconds?: number
                milliseconds?: number
            }
            if (typeof obj.toISOString === "function") {
                return t.Duration.from(obj.toISOString())
            }
            return t.Duration.from(obj)
        }
        return t.Duration.from(String(value))
    }

    static fromTemporal(value: Temporal.Duration): string {
        return value.toString()
    }
}
