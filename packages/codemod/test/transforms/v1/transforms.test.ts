import { expect } from "chai"
import fs from "node:fs"
import path from "node:path"
import { applyTransform } from "jscodeshift/src/testUtils"
import prettier from "prettier"

const fixturesDir = path.join(__dirname, "fixtures")

const format = async (source: string) =>
    prettier.format(source, {
        parser: "typescript",
        ...(await prettier.resolveConfig(fixturesDir)),
    })

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
        it(`${name}`, async () => {
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

            const formatted = await format(result)
            expect(formatted.trim()).to.equal(output.trim())
        })
    }
})
