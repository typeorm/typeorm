// Module-scoped Temporal type stubs used internally by TemporalUtils.
// Not declared globally — won't collide with the user's native or polyfill Temporal types.

export namespace Temporal {
    export interface Instant {
        readonly epochMilliseconds: number
        toString(): string
        toZonedDateTimeISO(timeZone: string): ZonedDateTime
    }

    export interface ZonedDateTime {
        readonly timeZoneId: string
        toInstant(): Instant
        toString(): string
    }

    export interface PlainDateTime {
        readonly year: number
        readonly month: number
        readonly day: number
        readonly hour: number
        readonly minute: number
        readonly second: number
        readonly millisecond: number
        toString(): string
    }

    export interface PlainDate {
        readonly year: number
        readonly month: number
        readonly day: number
        toString(): string
    }

    export interface PlainTime {
        readonly hour: number
        readonly minute: number
        readonly second: number
        toString(): string
    }

    export interface Duration {
        readonly years: number
        readonly months: number
        readonly weeks: number
        readonly days: number
        readonly hours: number
        readonly minutes: number
        readonly seconds: number
        readonly milliseconds: number
        toString(): string
    }
}

/** Shape of the global `Temporal` object exposed by Node 26+ or a polyfill. */
export interface TemporalGlobal {
    Instant: {
        fromEpochMilliseconds(ms: number): Temporal.Instant
        from(value: string): Temporal.Instant
    }
    ZonedDateTime: object
    PlainDateTime: {
        from(value: string | object): Temporal.PlainDateTime
    }
    PlainDate: {
        from(value: string | object): Temporal.PlainDate
    }
    PlainTime: {
        from(value: string | object): Temporal.PlainTime
    }
    Duration: {
        from(value: string | object): Temporal.Duration
    }
}
