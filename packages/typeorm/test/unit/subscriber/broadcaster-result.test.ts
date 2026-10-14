import { expect } from "chai"
import { BroadcasterResult } from "../../../src/subscriber/BroadcasterResult"

describe("broadcaster result", () => {
    it("awaits an event added after an earlier wait, as Expo does after a query failure", async () => {
        const result = new BroadcasterResult()
        const events: string[] = []
        result.add(async () => {
            events.push("query succeeded")
        })
        await result.wait()

        const failure = new Error("failure-event subscriber rejected")
        result.add(async () => {
            await Promise.resolve()
            events.push("query failed")
            throw failure
        })

        try {
            await result.wait()
            expect.fail("the second wait must observe the new subscriber")
        } catch (error) {
            expect(error).to.equal(failure)
        }
        expect(events).to.deep.equal(["query succeeded", "query failed"])
        expect(result.count).to.equal(2)
    })
})
