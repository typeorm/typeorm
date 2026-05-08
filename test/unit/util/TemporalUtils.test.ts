import "reflect-metadata"
import { expect } from "chai"
import {
    DurationUtils,
    PlainDateTimeUtils,
    PlainDateUtils,
    PlainTimeUtils,
    TemporalUtils,
    ZonedDateTimeUtils,
} from "../../../src/util/TemporalUtils"

const supported = typeof (globalThis as any).Temporal !== "undefined"
const T = (): any => (globalThis as any).Temporal

describe("TemporalUtils", () => {
    it("isSupported returns true when globalThis.Temporal exists", () => {
        expect(TemporalUtils.isSupported()).to.equal(supported)
    })

    it("inferKindFromReflectType maps Temporal classes to kinds", function () {
        if (!supported) this.skip()
        expect(
            TemporalUtils.inferKindFromReflectType(T().ZonedDateTime),
        ).to.equal("zoned")
        expect(
            TemporalUtils.inferKindFromReflectType(T().PlainDateTime),
        ).to.equal("plainDateTime")
        expect(TemporalUtils.inferKindFromReflectType(T().PlainDate)).to.equal(
            "plainDate",
        )
        expect(TemporalUtils.inferKindFromReflectType(T().PlainTime)).to.equal(
            "plainTime",
        )
        expect(TemporalUtils.inferKindFromReflectType(T().Duration)).to.equal(
            "duration",
        )
        expect(TemporalUtils.inferKindFromReflectType(Date)).to.equal(undefined)
    })
})

describe("ZonedDateTimeUtils", () => {
    it("toTemporal requires timeZone", function () {
        if (!supported) this.skip()
        expect(() => ZonedDateTimeUtils.toTemporal(new Date(), "")).to.throw(
            /timeZone/,
        )
    })

    it("toTemporal: Date + tz → ZonedDateTime", function () {
        if (!supported) this.skip()
        const d = new Date("2026-05-07T03:00:00Z")
        const r: any = ZonedDateTimeUtils.toTemporal(d, "Asia/Seoul")
        expect(r).to.be.instanceOf(T().ZonedDateTime)
        expect(r.timeZoneId).to.equal("Asia/Seoul")
        expect(r.toInstant().epochMilliseconds).to.equal(d.getTime())
    })

    it("toTemporal: null → null", () => {
        expect(ZonedDateTimeUtils.toTemporal(null, "UTC")).to.equal(null)
    })

    it("fromTemporal: ZonedDateTime → string", function () {
        if (!supported) this.skip()
        const zdt = T()
            .Instant.fromEpochMilliseconds(0)
            .toZonedDateTimeISO("UTC")
        expect(ZonedDateTimeUtils.fromTemporal(zdt)).to.be.a("string")
    })
})

describe("PlainDateTimeUtils", () => {
    it("toTemporal: Date → PlainDateTime via wall-clock components", function () {
        if (!supported) this.skip()
        const d = new Date(2026, 4, 7, 12, 34, 56, 789)
        const r: any = PlainDateTimeUtils.toTemporal(d)
        expect(r).to.be.instanceOf(T().PlainDateTime)
        expect(r.year).to.equal(2026)
        expect(r.month).to.equal(5)
        expect(r.day).to.equal(7)
        expect(r.hour).to.equal(12)
        expect(r.minute).to.equal(34)
        expect(r.second).to.equal(56)
        expect(r.millisecond).to.equal(789)
    })

    it("toTemporal: 'YYYY-MM-DD HH:mm:ss' string is normalised to ISO", function () {
        if (!supported) this.skip()
        const r: any = PlainDateTimeUtils.toTemporal("2026-05-07 12:34:56")
        expect(r).to.be.instanceOf(T().PlainDateTime)
        expect(r.toString()).to.equal("2026-05-07T12:34:56")
    })

    it("toTemporal: null → null", () => {
        expect(PlainDateTimeUtils.toTemporal(null)).to.equal(null)
    })

    it("fromTemporal: PlainDateTime → string", function () {
        if (!supported) this.skip()
        const p = T().PlainDateTime.from("2026-05-07T12:34:56")
        expect(PlainDateTimeUtils.fromTemporal(p)).to.equal(
            "2026-05-07T12:34:56",
        )
    })
})

describe("PlainDateUtils", () => {
    it("toTemporal: ISO string → PlainDate", function () {
        if (!supported) this.skip()
        const r: any = PlainDateUtils.toTemporal("2026-05-07")
        expect(r).to.be.instanceOf(T().PlainDate)
        expect(r.toString()).to.equal("2026-05-07")
    })

    it("toTemporal: Date → PlainDate (UTC components)", function () {
        if (!supported) this.skip()
        const d = new Date(Date.UTC(2026, 4, 7))
        const r: any = PlainDateUtils.toTemporal(d)
        expect(r.year).to.equal(2026)
        expect(r.month).to.equal(5)
        expect(r.day).to.equal(7)
    })

    it("toTemporal: null → null", () => {
        expect(PlainDateUtils.toTemporal(null)).to.equal(null)
    })

    it("fromTemporal: PlainDate → string", function () {
        if (!supported) this.skip()
        const p = T().PlainDate.from("2026-05-07")
        expect(PlainDateUtils.fromTemporal(p)).to.equal("2026-05-07")
    })
})

describe("PlainTimeUtils", () => {
    it("toTemporal: string → PlainTime", function () {
        if (!supported) this.skip()
        const r: any = PlainTimeUtils.toTemporal("12:34:56")
        expect(r).to.be.instanceOf(T().PlainTime)
        expect(r.toString()).to.equal("12:34:56")
    })

    it("toTemporal: null → null", () => {
        expect(PlainTimeUtils.toTemporal(null)).to.equal(null)
    })

    it("fromTemporal: PlainTime → string", function () {
        if (!supported) this.skip()
        const p = T().PlainTime.from("12:34:56")
        expect(PlainTimeUtils.fromTemporal(p)).to.equal("12:34:56")
    })
})

describe("DurationUtils", () => {
    it("toTemporal: ISO 8601 string → Duration", function () {
        if (!supported) this.skip()
        const r: any = DurationUtils.toTemporal("P1Y2M3D")
        expect(r).to.be.instanceOf(T().Duration)
        expect(r.years).to.equal(1)
        expect(r.months).to.equal(2)
        expect(r.days).to.equal(3)
    })

    it("toTemporal: null → null", () => {
        expect(DurationUtils.toTemporal(null)).to.equal(null)
    })

    it("fromTemporal: Duration → ISO 8601", function () {
        if (!supported) this.skip()
        const d = T().Duration.from({ years: 1, months: 2, days: 3 })
        expect(DurationUtils.fromTemporal(d)).to.equal("P1Y2M3D")
    })
})
