import { expect } from "chai"
import { formatTime } from "../../src/lib/format-time"

describe("formatTime", () => {
    it("should format seconds below 60", () => {
        expect(formatTime(5.6)).to.equal("5.6s")
        expect(formatTime(0.1)).to.equal("0.1s")
        expect(formatTime(59.9)).to.equal("59.9s")
    })

    it("should format minutes and seconds", () => {
        expect(formatTime(65)).to.equal("1m 5s")
        expect(formatTime(130)).to.equal("2m 10s")
        expect(formatTime(3661)).to.equal("61m 1s")
    })

    it("should omit seconds when exactly on the minute", () => {
        expect(formatTime(60)).to.equal("1m")
        expect(formatTime(120)).to.equal("2m")
    })

    it("should handle zero", () => {
        expect(formatTime(0)).to.equal("0.0s")
    })
})
