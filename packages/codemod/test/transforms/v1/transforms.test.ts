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

function getFixturePairs(): {
    transform: string
    name: string
    input: string
    output: string
}[] {
    const dirs = fs
        .readdirSync(fixturesDir, { withFileTypes: true })
        .filter((d) => d.isDirectory())

    return dirs.flatMap((dir) => {
        const transform = dir.name
        const files = fs
            .readdirSync(path.join(fixturesDir, transform))
            .filter((f) => f.endsWith(".input.ts"))
            .map((f) => f.slice(0, -".input.ts".length))

        return files.map((name) => ({
            transform,
            name,
            input: fs.readFileSync(
                path.join(fixturesDir, transform, `${name}.input.ts`),
                "utf8",
            ),
            output: fs.readFileSync(
                path.join(fixturesDir, transform, `${name}.output.ts`),
                "utf8",
            ),
        }))
    })
}

describe("v1 transforms", () => {
    const pairs = getFixturePairs()

    for (const { transform, name, input, output } of pairs) {
        it(`${transform}/${name}`, async () => {
            const transformPath = path.join(
                __dirname,
                "../../../src/transforms/v1",
                `${transform}.ts`,
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

            // When the transform returns `undefined` (no changes),
            // `applyTransform` returns an empty string — treat that as "input
            // unchanged" so fixtures can assert the source is left alone.
            const source = result === "" ? input : result
            const formatted = await format(source)
            expect(formatted.trim()).to.equal(output.trim())
        })
    }
})
