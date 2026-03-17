import { expect } from "chai"
import fs from "fs"
import path from "path"
import { applyTransform } from "jscodeshift/src/testUtils"

const fixturesDir = path.join(__dirname, "__testfixtures__")

function getFixturePairs(): { name: string; input: string; output: string }[] {
    const files = fs.readdirSync(fixturesDir)
    const inputs = files.filter((f) => f.endsWith(".input.ts"))

    return inputs.map((inputFile) => {
        const name = inputFile.replace(".input.ts", "")
        const outputFile = `${name}.output.ts`
        return {
            name,
            input: fs.readFileSync(path.join(fixturesDir, inputFile), "utf8"),
            output: fs.readFileSync(path.join(fixturesDir, outputFile), "utf8"),
        }
    })
}

describe("v1 transforms", () => {
    const pairs = getFixturePairs()

    for (const { name, input, output } of pairs) {
        it(`${name}`, () => {
            const transformPath = path.join(
                __dirname,
                "../../../src/transforms/v1",
                `${name}.ts`,
            )

            const transformModule = require(transformPath)

            const result = applyTransform(
                transformModule.default
                    ? transformModule
                    : { default: transformModule },
                {},
                { source: input, path: "test.ts" },
                { parser: "tsx" },
            )

            const normalize = (s: string) =>
                s.trim().replace(/\s+/g, " ").replace(/,\s*}/g, " }")

            expect(normalize(result)).to.equal(normalize(output))
        })
    }
})
