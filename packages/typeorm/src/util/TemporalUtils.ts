import type { Temporal, TemporalGlobal } from "./Temporal"

// Falls back to `globalThis.Temporal` when `DataSourceOptions.temporal` isn't passed.
const temporal = (dataSourceTemporal?: unknown): TemporalGlobal =>
    (dataSourceTemporal ??
        (globalThis as { Temporal?: unknown }).Temporal) as TemporalGlobal

export type TemporalKind =
    | "zoned-date-time"
    | "plain-date-time"
    | "plain-date"
    | "plain-time"
    | "duration"

/**
 * Provides Temporal API runtime detection and column-type inference for Temporal-typed entity properties.
 */
export class TemporalUtils {
    static isSupported(dataSourceTemporal?: unknown): boolean {
        return temporal(dataSourceTemporal) !== undefined
    }

    /**
     * Identifies a Temporal class without leaking the `./Temporal` stub to callers.
     * Keeps the opt-in stub dependency in a single file so it can be removed in one place once Temporal is natively supported.
     *
     * @param reflectType
     * @param dataSourceTemporal
     */
    static inferKindFromReflectType(
        reflectType: unknown,
        dataSourceTemporal?: unknown,
    ): TemporalKind | undefined {
        if (reflectType == null) return undefined
        const Temporal = temporal(dataSourceTemporal)
        if (!Temporal) return undefined
        if (reflectType === Temporal.ZonedDateTime) return "zoned-date-time"
        if (reflectType === Temporal.PlainDateTime) return "plain-date-time"
        if (reflectType === Temporal.PlainDate) return "plain-date"
        if (reflectType === Temporal.PlainTime) return "plain-time"
        if (reflectType === Temporal.Duration) return "duration"
        return undefined
    }
}

/**
 * Converts between database values and `Temporal.ZonedDateTime`. Used for `timestamptz` columns; defaults to `UTC` when `temporal: true` and uses the configured IANA zone when `temporal: { timeZone }` is given.
 */
export class ZonedDateTimeUtils {
    static toTemporal(
        value: Date | string | null | undefined,
        timeZone: string = "UTC",
        dataSourceTemporal?: unknown,
    ): Temporal.ZonedDateTime | null {
        if (value === null || value === undefined) return null
        const Temporal = temporal(dataSourceTemporal)
        if (value instanceof Date)
            return Temporal.Instant.fromEpochMilliseconds(
                value.getTime(),
            ).toZonedDateTimeISO(timeZone)
        return Temporal.Instant.from(
            value.replace(" ", "T"),
        ).toZonedDateTimeISO(timeZone)
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
        dataSourceTemporal?: unknown,
    ): Temporal.PlainDateTime | null {
        if (value === null || value === undefined) return null
        const Temporal = temporal(dataSourceTemporal)
        if (value instanceof Date) {
            return Temporal.PlainDateTime.from({
                year: value.getFullYear(),
                month: value.getMonth() + 1,
                day: value.getDate(),
                hour: value.getHours(),
                minute: value.getMinutes(),
                second: value.getSeconds(),
                millisecond: value.getMilliseconds(),
            })
        }
        return Temporal.PlainDateTime.from(value.replace(" ", "T"))
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
        options?: { utc?: boolean },
        dataSourceTemporal?: unknown,
    ): Temporal.PlainDate | null {
        if (value === null || value === undefined) return null
        const Temporal = temporal(dataSourceTemporal)
        if (value instanceof Date) {
            // Mirror DateUtils.mixedDateToDateString: defaults to local-time
            // components, picks UTC components only when `utc` is set.
            const utc = options?.utc ?? false
            return Temporal.PlainDate.from(
                utc
                    ? {
                          year: value.getUTCFullYear(),
                          month: value.getUTCMonth() + 1,
                          day: value.getUTCDate(),
                      }
                    : {
                          year: value.getFullYear(),
                          month: value.getMonth() + 1,
                          day: value.getDate(),
                      },
            )
        }
        return Temporal.PlainDate.from(value)
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
        dataSourceTemporal?: unknown,
    ): Temporal.PlainTime | null {
        if (value === null || value === undefined) return null
        return temporal(dataSourceTemporal).PlainTime.from(value)
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
        dataSourceTemporal?: unknown,
    ): Temporal.Duration | null {
        if (value === null || value === undefined) return null
        const Temporal = temporal(dataSourceTemporal)
        if (typeof value === "object") {
            // `pg` driver returns `interval` as a `postgres-interval` object whose `toString()` is non-ISO ("1 day 04:05:06"); prefer its `toISOString()` when available.
            const intervalLike = value as { toISOString?: () => string }
            if (typeof intervalLike.toISOString === "function") {
                return Temporal.Duration.from(intervalLike.toISOString())
            }
            return Temporal.Duration.from(value)
        }
        return Temporal.Duration.from(value)
    }

    static fromTemporal(value: Temporal.Duration): string {
        return value.toString()
    }
}
