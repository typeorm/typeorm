import { expect } from "chai"

import { AlreadyHasActiveConnectionError } from "typeorm/error/AlreadyHasActiveConnectionError"
import { CannotGetEntityManagerNotConnectedError } from "typeorm/error/CannotGetEntityManagerNotConnectedError"

describe("errors > prototype tree", () => {
    it("prototype tree makes sense", () => {
        const err = new AlreadyHasActiveConnectionError("test")

        expect(err.name).to.be.equal("AlreadyHasActiveConnectionError")
        expect(err).to.be.instanceOf(AlreadyHasActiveConnectionError)

        const otherErr = new CannotGetEntityManagerNotConnectedError("test")

        expect(otherErr).to.be.instanceOf(
            CannotGetEntityManagerNotConnectedError,
        )
    })
})
