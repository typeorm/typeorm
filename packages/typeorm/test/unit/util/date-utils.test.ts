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

    it("should expose its static helpers through the public export", () => {
        const date = new Date(Date.UTC(2023, 4, 9))
        expect(DateUtils.mixedDateToDateString(date, { utc: true })).to.equal(
            "2023-05-09",
        )
    })
})
