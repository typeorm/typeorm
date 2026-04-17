import { expect } from "chai"
import { applyTransform } from "jscodeshift/src/testUtils"
import type { Transform } from "jscodeshift"
import { transforms } from "../../../src/transforms/v1"

/**
 * A realistic non-TypeORM file with property names, option keys, and method
 * calls that coincidentally collide with TypeORM. A transform that skips the
 * import-scope check would silently rewrite these. Covers the main failure
 * mode flagged in the audit: codemods touching unrelated configs.
 */
const source = `
// HTTP fetch options
const response = await fetch(url, {
    type: "sqlite",
    flags: 0,
    width: 9,
    zerofill: true,
})

// Form config
const field = {
    name: "author",
    readonly: true,
    unsigned: false,
    connectorPackage: "mysql2",
    select: ["id", "name"],
    relations: ["posts"],
    lock: { mode: "pessimistic_partial_write" },
}

// Data grid config
const grid = { busyTimeout: 5000, domain: "example.com" }

// Unrelated builder-ish helpers
qb.setNativeParameters({ key: "value" })
qb.printSql()
qb.onConflict("DO NOTHING")
qb.orUpdate({ conflict_target: ["a"], overwrite: ["b"] })
qb.loadedTables
userStore.exist({})
userStore.findOneById(1)
mongoClient.stats()
migrationRunner.getAllMigrations()

// A class with an override that shares TypeORM's internal method name
class MyBuilder {
    replacePropertyNames(q: string) { return q }
}

// Real-world regression: nest-commander decorators use \`flags\` too, and
// were getting stripped by datasource-sqlite-options before the scope guard.
import { Command, CommandRunner, Option } from "nest-commander"

@Command({ name: "basic", description: "A parameter parse" })
export class BasicCommand extends CommandRunner {
    @Option({
        flags: "-n, --number [number]",
        description: "A basic number parser",
    })
    parseNumber(val: string): number {
        return Number(val)
    }
}
`

describe("v1 transforms — no typeorm import", () => {
    for (const transform of transforms) {
        const { name, fn } = transform as unknown as {
            name: string
            fn: Transform
        }
        it(`${name} does not modify a non-typeorm file`, () => {
            const result = applyTransform(
                { default: fn, parser: undefined } as {
                    default: Transform
                    parser: undefined
                },
                {},
                { source, path: "not-typeorm.ts" },
                { parser: "tsx" },
            )
            // jscodeshift returns an empty string when the transform returns
            // undefined (no changes). A non-empty result means the transform
            // rewrote the file — a scope-guard regression.
            expect(result).to.equal("")
        })
    }
})
