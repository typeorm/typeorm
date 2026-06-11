import { expect } from "chai"
import { shorten } from "../../../src/util/StringUtils"

describe("github issues > #9544 shorten long camel case alias correctly", () => {
    const testCases = [
        {
            input: "SupplierStockInTransit__supplierStock__productVariant_customFields_tryonFrameAsset",
            expected: "SuStInTr__suSt__prVacuFitrFrAs",
        },
        {
            input: "SupplierStockInTransit__supplierStock__productVariant_customFields_visualFrameAsset",
            expected: "SuStInTr__suSt__prVacuFiviFrAs",
        },
        {
            input: "camelCase_alias",
            expected: "caCaal",
        },
    ]

    testCases.map((testCase, i) => {
        it(`should produce correct results for camel case aliases, case #${i + 1}`, () => {
            const { input, expected } = testCase
            expect(shorten(input)).to.equal(expected)
        })
    })

    it("should produce unique results for different inputs", () => {
        const uniqueInputs = new Set(testCases.map((x) => x.input))
        const uniqueExpects = new Set(testCases.map((x) => x.expected))

        expect(uniqueInputs.size).to.equal(testCases.length)
        expect(uniqueExpects.size).to.equal(testCases.length)
    })
})
