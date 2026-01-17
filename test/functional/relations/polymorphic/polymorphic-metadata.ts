import { expect } from "chai"
import { getMetadataArgsStorage } from "../../../../src"

describe("polymorphic relation metadata", () => {
    it("should mark relation as polymorphic", () => {
        const relation = getMetadataArgsStorage().relations.find(
            (r) => r.propertyName === "article",
        )

        expect(relation).to.exist
        expect((relation as any).options.polymorphic).to.exist
    })
})
