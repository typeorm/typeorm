import "reflect-metadata"
import { expect } from "chai"
import { Temporal } from "@js-temporal/polyfill"
import {
    DurationUtils,
    PlainDateTimeUtils,
    PlainDateUtils,
    PlainTimeUtils,
    TemporalUtils,
    ZonedDateTimeUtils,
} from "../../../src/util/TemporalUtils"

describe("TemporalUtils", () => {
    it("isSupported returns true when globalThis.Temporal exists", () => {
        expect(TemporalUtils.isSupported()).to.equal(true)
    })

    it("inferKindFromReflectType maps Temporal classes to driver-agnostic kinds", () => {
        expect(
            TemporalUtils.inferKindFromReflectType(Temporal.ZonedDateTime),
        ).to.equal("zoned-date-time")
        expect(
            TemporalUtils.inferKindFromReflectType(Temporal.PlainDateTime),
        ).to.equal("plain-date-time")
        expect(
            TemporalUtils.inferKindFromReflectType(Temporal.PlainDate),
        ).to.equal("plain-date")
        expect(
            TemporalUtils.inferKindFromReflectType(Temporal.PlainTime),
        ).to.equal("plain-time")
        expect(
            TemporalUtils.inferKindFromReflectType(Temporal.Duration),
        ).to.equal("duration")
        expect(TemporalUtils.inferKindFromReflectType(Date)).to.equal(undefined)
    })
})

describe("ZonedDateTimeUtils", () => {
    it("toTemporal requires timeZone", () => {
        expect(() => ZonedDateTimeUtils.toTemporal(new Date(), "")).to.throw(
            /time ?zone/i,
        )
    })

    it("toTemporal: Date + tz → ZonedDateTime", () => {
        const d = new Date("2026-05-07T03:00:00Z")
        const r = ZonedDateTimeUtils.toTemporal(d, "Asia/Seoul")
        expect(r).to.be.instanceOf(Temporal.ZonedDateTime)
        expect(r!.timeZoneId).to.equal("Asia/Seoul")
        expect(r!.toInstant().epochMilliseconds).to.equal(d.getTime())
    })

    it("toTemporal: null → null", () => {
        expect(ZonedDateTimeUtils.toTemporal(null, "UTC")).to.equal(null)
    })

    it("fromTemporal: ZonedDateTime → string", () => {
        const zdt =
            Temporal.Instant.fromEpochMilliseconds(0).toZonedDateTimeISO("UTC")
        expect(ZonedDateTimeUtils.fromTemporal(zdt)).to.be.a("string")
    })
})

describe("PlainDateTimeUtils", () => {
    it("toTemporal: Date → PlainDateTime via wall-clock components", () => {
        const d = new Date(2026, 4, 7, 12, 34, 56, 789)
        const r = PlainDateTimeUtils.toTemporal(d)
        expect(r).to.be.instanceOf(Temporal.PlainDateTime)
        expect(r!.year).to.equal(2026)
        expect(r!.month).to.equal(5)
        expect(r!.day).to.equal(7)
        expect(r!.hour).to.equal(12)
        expect(r!.minute).to.equal(34)
        expect(r!.second).to.equal(56)
        expect(r!.millisecond).to.equal(789)
    })

    it("toTemporal: 'YYYY-MM-DD HH:mm:ss' string is normalized to ISO", () => {
        const r = PlainDateTimeUtils.toTemporal("2026-05-07 12:34:56")
        expect(r).to.be.instanceOf(Temporal.PlainDateTime)
        expect(r!.toString()).to.equal("2026-05-07T12:34:56")
    })

    it("toTemporal: null → null", () => {
        expect(PlainDateTimeUtils.toTemporal(null)).to.equal(null)
    })

    it("fromTemporal: PlainDateTime → string", () => {
        const p = Temporal.PlainDateTime.from("2026-05-07T12:34:56")
        expect(PlainDateTimeUtils.fromTemporal(p)).to.equal(
            "2026-05-07T12:34:56",
        )
    })
})

describe("PlainDateUtils", () => {
    it("toTemporal: ISO string → PlainDate", () => {
        const r = PlainDateUtils.toTemporal("2026-05-07")
        expect(r).to.be.instanceOf(Temporal.PlainDate)
        expect(r!.toString()).to.equal("2026-05-07")
    })

    it("toTemporal: Date → PlainDate uses local components by default", () => {
        // Pick a wall-clock instant whose UTC and local day differ in
        // off-UTC zones; assertions reference the runtime's local components.
        const d = new Date(Date.UTC(2026, 4, 7, 23, 30))
        const r = PlainDateUtils.toTemporal(d)
        expect(r!.year).to.equal(d.getFullYear())
        expect(r!.month).to.equal(d.getMonth() + 1)
        expect(r!.day).to.equal(d.getDate())
    })

    it("toTemporal: Date + { utc: true } → PlainDate uses UTC components", () => {
        const d = new Date(Date.UTC(2026, 4, 7, 23, 30))
        const r = PlainDateUtils.toTemporal(d, { utc: true })
        expect(r!.year).to.equal(2026)
        expect(r!.month).to.equal(5)
        expect(r!.day).to.equal(7)
    })

    it("toTemporal: null → null", () => {
        expect(PlainDateUtils.toTemporal(null)).to.equal(null)
    })

    it("fromTemporal: PlainDate → string", () => {
        const p = Temporal.PlainDate.from("2026-05-07")
        expect(PlainDateUtils.fromTemporal(p)).to.equal("2026-05-07")
    })
})

describe("PlainTimeUtils", () => {
    it("toTemporal: string → PlainTime", () => {
        const r = PlainTimeUtils.toTemporal("12:34:56")
        expect(r).to.be.instanceOf(Temporal.PlainTime)
        expect(r!.toString()).to.equal("12:34:56")
    })

    it("toTemporal: null → null", () => {
        expect(PlainTimeUtils.toTemporal(null)).to.equal(null)
    })

    it("fromTemporal: PlainTime → string", () => {
        const p = Temporal.PlainTime.from("12:34:56")
        expect(PlainTimeUtils.fromTemporal(p)).to.equal("12:34:56")
    })
})

describe("DurationUtils", () => {
    it("toTemporal: ISO 8601 string → Duration", () => {
        const r = DurationUtils.toTemporal("P1Y2M3D")
        expect(r).to.be.instanceOf(Temporal.Duration)
        expect(r!.years).to.equal(1)
        expect(r!.months).to.equal(2)
        expect(r!.days).to.equal(3)
    })

    it("toTemporal: null → null", () => {
        expect(DurationUtils.toTemporal(null)).to.equal(null)
    })

    it("fromTemporal: Duration → ISO 8601", () => {
        const d = Temporal.Duration.from({ years: 1, months: 2, days: 3 })
        expect(DurationUtils.fromTemporal(d)).to.equal("P1Y2M3D")
    })
})
