import "reflect-metadata"
import { expect } from "chai"
import type { DataSource } from "../../../../src"
import { EntitySchema, TableCheck } from "../../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../../utils/test-utils"
import {
    expectNoDropOfName,
    expectSyncIsIdempotent,
} from "./rename-on-naming-change-helpers"

// `renameCheckConstraint` targets dialects with named check constraints and
// a catalog-visible rename path. CockroachDB is excluded because its check
// constraint names are system-generated — the seed-and-rename pattern has
// nothing stable to match against. MySQL/MariaDB's driver doesn't surface
// check constraints; SAP has no native check-rename.
const ENABLED_DRIVERS = ["postgres", "mssql", "oracle"] as const

async function getCheckNames(
    dataSource: DataSource,
    tableName: string,
): Promise<string[]> {
    const qr = dataSource.createQueryRunner()
    try {
        const table = await qr.getTable(tableName)
        return table?.checks.map((c) => c.name ?? "") ?? []
    } finally {
        await qr.release()
    }
}

// Single-column check with an explicit name. The expression uses a trivial
// predicate so it round-trips identically across Postgres / MSSQL / Oracle.
const PersonNewCheck = new EntitySchema<any>({
    name: "rc_chk_person",
    tableName: "rc_chk_person",
    columns: {
        id: { type: Number, primary: true },
        age: { type: Number, nullable: false },
    },
    checks: [{ name: "chk_new", expression: `"age" > 0` }],
})

describe("schema builder > rename on naming change > check", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            enabledDrivers: [...ENABLED_DRIVERS],
            entities: [PersonNewCheck],
            schemaCreate: false,
            dropSchema: true,
        })
    })

    after(() => closeTestingConnections(dataSources))

    async function seedCheckUnderOldName(
        dataSource: DataSource,
        oldName: string,
    ): Promise<void> {
        await dataSource.synchronize()
        const qr = dataSource.createQueryRunner()
        try {
            const table = await qr.getTable("rc_chk_person")
            expect(
                table?.checks.some((c) => c.name === "chk_new"),
                `seed expected chk_new on ${dataSource.driver.options.type}`,
            ).to.be.true
            await qr.renameCheckConstraint!("rc_chk_person", "chk_new", oldName)
        } finally {
            await qr.release()
        }
    }

    it("custom → different custom: rename, no DROP of old name", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await seedCheckUnderOldName(dataSource, "chk_old")

                const log = await dataSource.driver.createSchemaBuilder().log()
                expectNoDropOfName(log.upQueries, "chk_old")

                await dataSource.synchronize()
                const names = await getCheckNames(dataSource, "rc_chk_person")
                expect(names, dataSource.driver.options.type).to.include(
                    "chk_new",
                )
                expect(names, dataSource.driver.options.type).to.not.include(
                    "chk_old",
                )
            }),
        ))

    it("second sync after renaming the check is idempotent", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await seedCheckUnderOldName(dataSource, "chk_old")
                await dataSource.synchronize()

                await expectSyncIsIdempotent(dataSource)
            }),
        ))
})

// Duplicate-on-db scenario: two checks on the same expression under different
// names while metadata declares one. The reconciler pairs one as a rename and
// leaves the other for the drop pass.
const PersonDupCheck = new EntitySchema<any>({
    name: "rc_chk_dup",
    tableName: "rc_chk_dup",
    columns: {
        id: { type: Number, primary: true },
        age: { type: Number, nullable: false },
    },
    checks: [{ name: "chk_new", expression: `"age" > 0` }],
})

describe("schema builder > rename on naming change > check (db duplicates)", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            enabledDrivers: [...ENABLED_DRIVERS],
            entities: [PersonDupCheck],
            schemaCreate: false,
            dropSchema: true,
        })
    })

    after(() => closeTestingConnections(dataSources))

    it("renames one duplicate to the metadata name and drops the other", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await dataSource.synchronize()

                const qr = dataSource.createQueryRunner()
                try {
                    await qr.renameCheckConstraint!(
                        "rc_chk_dup",
                        "chk_new",
                        "chk_old1",
                    )
                    await qr.createCheckConstraint(
                        "rc_chk_dup",
                        new TableCheck({
                            name: "chk_old2",
                            expression: `"age" > 0`,
                        }),
                    )
                } finally {
                    await qr.release()
                }

                const log = await dataSource.driver.createSchemaBuilder().log()
                expectNoDropOfName(log.upQueries, "chk_old1")

                await dataSource.synchronize()
                const names = await getCheckNames(dataSource, "rc_chk_dup")
                expect(names, dataSource.driver.options.type).to.include(
                    "chk_new",
                )
                expect(names, dataSource.driver.options.type).to.not.include(
                    "chk_old1",
                )
                expect(names, dataSource.driver.options.type).to.not.include(
                    "chk_old2",
                )

                await expectSyncIsIdempotent(dataSource)
            }),
        ))
})
