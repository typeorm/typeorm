import type { ColumnType } from "../driver/types/ColumnTypes"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const T = (): any => (globalThis as any).Temporal

/**
 * Provides Temporal API runtime detection and column-type inference for Temporal-typed entity properties.
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
 * Converts between database values and `Temporal.ZonedDateTime`. Used for `timestamptz` columns when a specific IANA time zone is configured.
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
 * Converts between database values and `Temporal.PlainDateTime`. Used for `timestamp without time zone` columns; `Date` inputs are read as wall-clock components in the runtime's local time zone.
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
 * Converts between database values and `Temporal.PlainDate`. Used for `date` columns.
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
 * Converts between database values and `Temporal.PlainTime`. Used for `time without time zone` columns.
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
 * Converts between database values and `Temporal.Duration`. Used for `interval` columns.
 */
export class DurationUtils {
    static toTemporal(
        value: string | object | null | undefined,
    ): Temporal.Duration | null {
        if (value === null || value === undefined) return null

        const t = T()
        // `pg` driver returns `interval` as a `postgres-interval` object whose `toString()` is non-ISO ("1 day 04:05:06"); prefer its `toISOString()` when available.
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
