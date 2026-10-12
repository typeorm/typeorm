import { expect } from "chai"

// Importing from the package entry point is the point of the regression:
// `DateUtils` must be re-exported from "typeorm", like its sibling utilities.
// See https://github.com/typeorm/typeorm/issues/3948
import { DateUtils } from "../../../src"
import { DateUtils as DateUtilsDirect } from "../../../src/util/DateUtils"

describe("DateUtils", () => {
    it("should be exported from the package entry point", () => {
        expect(DateUtils).to.be.a("function")
        expect(DateUtils).to.equal(DateUtilsDirect)
    })

    describe("mixedDateToDate", () => {
        // These assert local components rather than an ISO string, so they hold
        // in any timezone. The distinction they protect is exactly the one that
        // "new Date(string)" gets wrong: a bare date is local, not UTC.

        it("reads a date-only string as local midnight", () => {
            const date = DateUtils.mixedDateToDate("2021-04-28")

            expect(date.getFullYear()).to.equal(2021)
            expect(date.getMonth()).to.equal(3)
            expect(date.getDate()).to.equal(28)
            expect(date.getHours()).to.equal(0)
            expect(date.getMinutes()).to.equal(0)
        })

        it("reads a date-time without a zone as local time", () => {
            const date = DateUtils.mixedDateToDate("2021-04-28T10:20:30")

            expect(date.getFullYear()).to.equal(2021)
            expect(date.getMonth()).to.equal(3)
            expect(date.getDate()).to.equal(28)
            expect(date.getHours()).to.equal(10)
            expect(date.getMinutes()).to.equal(20)
            expect(date.getSeconds()).to.equal(30)
        })

        it("accepts a space between the date and the time", () => {
            const date = DateUtils.mixedDateToDate("2021-04-28 10:20:30")

            expect(date.getHours()).to.equal(10)
            expect(date.getSeconds()).to.equal(30)
        })

        it("honours an explicit UTC marker", () => {
            const date = DateUtils.mixedDateToDate("2021-04-28T10:20:30Z")

            expect(date.getTime()).to.equal(
                Date.UTC(2021, 3, 28, 10, 20, 30, 0),
            )
        })

        it("honours an explicit offset", () => {
            const date = DateUtils.mixedDateToDate("2021-04-28T10:20:30+05:30")

            expect(date.getTime()).to.equal(Date.UTC(2021, 3, 28, 4, 50, 30, 0))
        })

        it("keeps only the first three digits of a fractional second", () => {
            const date = DateUtils.mixedDateToDate("2021-04-28T10:20:30.123456")

            expect(date.getMilliseconds()).to.equal(123)
        })

        it("returns an invalid date for a string it cannot parse", () => {
            const date = DateUtils.mixedDateToDate("not a date")

            expect(Number.isNaN(date.getTime())).to.be.true
        })

        it("passes a Date through untouched", () => {
            const source = new Date(2021, 3, 28, 10, 20, 30)

            expect(DateUtils.mixedDateToDate(source).getTime()).to.equal(
                source.getTime(),
            )
        })

        it("drops milliseconds when asked to", () => {
            const date = DateUtils.mixedDateToDate(
                "2021-04-28T10:20:30.123",
                false,
                false,
            )

            expect(date.getMilliseconds()).to.equal(0)
        })
    })

    it("should expose its static helpers through the public export", () => {
        const date = new Date(Date.UTC(2023, 4, 9))
        expect(DateUtils.mixedDateToDateString(date, { utc: true })).to.equal(
            "2023-05-09",
        )
    })
})
