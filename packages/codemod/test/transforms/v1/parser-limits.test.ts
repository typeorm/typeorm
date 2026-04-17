import { expect } from "chai"
import { applyTransform } from "jscodeshift/src/testUtils"
import type { Transform } from "jscodeshift"
import connectionToDataSource from "../../../src/transforms/v1/connection-to-datasource"

/**
 * jscodeshift's bundled parser rejects legacy-decorator + computed-class-field
 * combinations. The README documents this as a known limitation. This test
 * pins the current behaviour so a future jscodeshift upgrade that fixes the
 * parser will flip this test, letting us drop the limitation from the README.
 */
describe("v1 transforms — parser limitations", () => {
    const source = `
export class UserPreferencesDto extends AbstractDto {
    @ApiExpose({ enum: { DateFormat }, required: false })
    [UserPreference.DateFormat]?: DateFormat
}
`

    it("legacy-decorator + computed class field fails to parse (known limitation)", () => {
        expect(() =>
            applyTransform(
                {
                    default: connectionToDataSource,
                    parser: undefined,
                } as {
                    default: Transform
                    parser: undefined
                },
                {},
                { source, path: "dto.ts" },
                { parser: "tsx" },
            ),
        ).to.throw(/Unexpected token/)
    })
})
