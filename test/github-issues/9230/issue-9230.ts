import { DateUtils } from "../../../src/util/DateUtils"
import { expect } from "chai"

describe("github issues > #9230 Incorrect date parsing for year 1-999", () => {
    describe("mixedDateToDateString", () => {
        it("should format a year less than 1000 with correct 0 padding", () => {
            // Set this date to 0202-01-01 at 01:00 local time. 01:00 may help to avoid
            // rounding errors given that before 1883 we had some very weird timezone
            // offsets like -5:50 for Chicago.
            //
            // e.g., if we are 1 millisecond before 01:00 due to rounding, it won't affect
            // the year/month/day value.
            const date = new Date("0202-01-01")
            const timezoneHours = date.getTimezoneOffset() / 60
            date.setHours(date.getHours() + timezoneHours + 1)

            expect(DateUtils.mixedDateToDateString(date)).to.eq("0202-01-01")
        })
    })
})
