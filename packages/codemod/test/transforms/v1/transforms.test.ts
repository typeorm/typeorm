import { expect } from "chai"
import fs from "node:fs"
import path from "node:path"
import { applyTransform } from "jscodeshift/src/testUtils"
import type { Transform } from "jscodeshift"
import prettier from "prettier"

const fixturesDir = path.join(__dirname, "fixtures")

const format = async (source: string) =>
    prettier.format(source, {
        parser: "typescript",
        ...(await prettier.resolveConfig(fixturesDir, {
            editorconfig: true,
        })),
    })

function getFixturePairs(): { name: string; input: string; output: string }[] {
    const dirs = fs
        .readdirSync(fixturesDir, { withFileTypes: true })
        .filter((d) => d.isDirectory())

    return dirs.map((dir) => {
        const name = dir.name
        return {
            name,
            input: fs.readFileSync(
                path.join(fixturesDir, name, `${name}.input.ts`),
                "utf8",
            ),
            output: fs.readFileSync(
                path.join(fixturesDir, name, `${name}.output.ts`),
                "utf8",
            ),
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

            const transformModule = require(transformPath) as {
                default?: Transform
            }

            const result = applyTransform(
                (transformModule.default
                    ? transformModule
                    : { default: transformModule }) as {
                    default: Transform
                    parser: undefined
                },
                {},
                { source: input, path: "test.ts" },
                { parser: "tsx" },
            )

            const formatted = await format(result)
            expect(formatted.trim()).to.equal(output.trim())
        })
    }
})
