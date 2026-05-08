// Ambient type stub for the TC39 Temporal proposal.
//
// Required because the project's tsconfig targets Node 20's lib, which does
// not yet include `lib.temporal.d.ts`. Remove this file once the project
// upgrades to a TypeScript lib that ships Temporal types natively
// (TypeScript 6.0+ when configured for esnext.temporal).
//
// The runtime implementation is whatever `globalThis.Temporal` provides
// (Node 26+ native, or a Temporal-capable polyfill).
//
// Only the surface used by TypeORM's `TemporalUtils` is declared here.

export {}

declare global {
    namespace Temporal {
        class Instant {
            readonly epochMilliseconds: number
            toString(): string
            toZonedDateTimeISO(timeZone: string): ZonedDateTime
            static fromEpochMilliseconds(ms: number): Instant
            static from(value: string): Instant
        }

        class ZonedDateTime {
            readonly timeZoneId: string
            toInstant(): Instant
            toString(): string
        }

        class PlainDateTime {
            readonly year: number
            readonly month: number
            readonly day: number
            readonly hour: number
            readonly minute: number
            readonly second: number
            readonly millisecond: number
            toString(): string
            static from(value: string | object): PlainDateTime
        }

        class PlainDate {
            readonly year: number
            readonly month: number
            readonly day: number
            toString(): string
            static from(value: string | object): PlainDate
        }

        class PlainTime {
            readonly hour: number
            readonly minute: number
            readonly second: number
            toString(): string
            static from(value: string | object): PlainTime
        }

        class Duration {
            readonly years: number
            readonly months: number
            readonly weeks: number
            readonly days: number
            readonly hours: number
            readonly minutes: number
            readonly seconds: number
            readonly milliseconds: number
            toString(): string
            static from(value: string | object): Duration
        }
    }
}
