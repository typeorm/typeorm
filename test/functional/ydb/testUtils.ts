import { expect } from "chai"

export const testFields = (
    res: any,
    callableProp: false | "valueOf" | "toString",
    check: any,
) => {
    return Object.entries(check).forEach(([key, value]) => {
        if (callableProp)
            expect(res[key][callableProp]()).to.be.equal(
                value,
                `in ${key}: ${res[key][callableProp]()}!=${value}`,
            )
        else
            expect(res[key]).to.be.equal(
                value,
                `in ${key}: ${res[key]}!=${value}`,
            )
    })
}
