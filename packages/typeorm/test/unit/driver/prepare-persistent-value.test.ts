import { expect } from "chai"
import { PostgresDriver } from "../../../src/driver/postgres/PostgresDriver"
import { CockroachDriver } from "../../../src/driver/cockroachdb/CockroachDriver"
import type { ColumnMetadata } from "../../../src/metadata/ColumnMetadata"

describe("driver > preparePersistentValue", () => {
    const drivers: [
        string,
        {
            preparePersistentValue(
                value: any,
                columnMetadata: ColumnMetadata,
            ): any
        },
    ][] = [
        ["PostgresDriver", Object.create(PostgresDriver.prototype)],
        ["CockroachDriver", Object.create(CockroachDriver.prototype)],
    ]

    for (const [name, driver] of drivers) {
        describe(name, () => {
            it("should preserve boolean true and false for Boolean column", () => {
                const columnMetadata = { type: Boolean } as ColumnMetadata
                expect(
                    driver.preparePersistentValue(true, columnMetadata),
                ).to.equal(true)
                expect(
                    driver.preparePersistentValue(false, columnMetadata),
                ).to.equal(false)
            })

            it("should preserve null and undefined for Boolean column", () => {
                const columnMetadata = { type: Boolean } as ColumnMetadata
                expect(
                    driver.preparePersistentValue(null, columnMetadata),
                ).to.equal(null)
                expect(
                    driver.preparePersistentValue(undefined, columnMetadata),
                ).to.equal(undefined)
            })
        })
    }
})
