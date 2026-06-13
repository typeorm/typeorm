import { expect } from "chai"
import { NamingStrategyV03 } from "../../src/naming-strategy-v03"

describe("NamingStrategyV03", () => {
    it("should use the v0.3 behavior for hashing", () => {
        // given
        const namingStrategy = new NamingStrategyV03()
        const foreignKeyInput = "blog/article_authorId"

        // when
        // @ts-expect-error - we want to test the protected method
        const foreignKeyHash = namingStrategy.hash(foreignKeyInput)

        // then
        // the v0.3 name was: FK_1e0f5be367c6ab54832499c7adf
        expect(foreignKeyHash).to.equal(
            "1e0f5be367c6ab54832499c7adfedc177b7108c8",
        )
    })
})
