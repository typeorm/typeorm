import "reflect-metadata"
import { expect } from "chai"
import type { DataSource } from "../../../../src"
import { EntitySchema } from "../../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../../utils/test-utils"

const UserWithNewNames = new EntitySchema({
    name: "rc_user",
    tableName: "rc_user",
    columns: {
        id: { type: Number, primary: true },
        email: { type: String, nullable: false },
        tenantId: { type: Number, nullable: false },
    },
    indices: [{ name: "idx_new", columns: ["email"] }],
    uniques: [{ name: "uq_new", columns: ["email", "tenantId"] }],
})

describe("schema builder > rename on naming change", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            entities: [UserWithNewNames],
            enabledDrivers: ["postgres"],
            schemaCreate: false,
            dropSchema: true,
        })
    })

    after(() => closeTestingConnections(dataSources))

    async function seedWithOldNames(dataSource: DataSource): Promise<void> {
        // Create the table with the "new" names first via synchronize, then
        // rename the constraints to "old" names via DDL so the next sync pass
        // sees the drift the reconciler is meant to detect.
        await dataSource.synchronize()
        const qr = dataSource.createQueryRunner()
        try {
            const table = await qr.getTable("rc_user")
            expect(table?.indices.some((i) => i.name === "idx_new")).to.be.true
            expect(table?.uniques.some((u) => u.name === "uq_new")).to.be.true

            await qr.renameIndex!("rc_user", "idx_new", "idx_old")
            await qr.renameUniqueConstraint!("rc_user", "uq_new", "uq_old")
        } finally {
            await qr.release()
        }
    }

    it("emits RENAME (not DROP+CREATE) when index and unique names drifted from metadata", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await seedWithOldNames(dataSource)

                const log = await dataSource.driver.createSchemaBuilder().log()
                const upSql = log.upQueries.map((q) => q.query).join(" | ")

                expect(upSql).to.match(/RENAME.*idx_old.*idx_new/i)
                expect(upSql).to.match(/RENAME CONSTRAINT.*uq_old.*uq_new/i)
                expect(upSql).to.not.match(/DROP INDEX.*idx_old/i)
                expect(upSql).to.not.match(/DROP CONSTRAINT.*uq_old/i)
            }),
        ))

    it("emits no DDL on a second sync — reconciler is idempotent", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await seedWithOldNames(dataSource)
                await dataSource.synchronize()

                const log = await dataSource.driver.createSchemaBuilder().log()
                expect(log.upQueries).to.be.empty
            }),
        ))

    it("falls back to DROP+CREATE when reconcileConstraintNames is disabled", async () => {
        const optedOutSources = await createTestingConnections({
            entities: [UserWithNewNames],
            enabledDrivers: ["postgres"],
            schemaCreate: false,
            dropSchema: true,
            driverSpecific: { reconcileConstraintNames: false },
        })
        try {
            await Promise.all(
                optedOutSources.map(async (dataSource) => {
                    await seedWithOldNames(dataSource)

                    const log = await dataSource.driver
                        .createSchemaBuilder()
                        .log()
                    const upSql = log.upQueries.map((q) => q.query).join(" | ")

                    expect(upSql).to.not.match(/RENAME.*idx_old.*idx_new/i)
                    expect(upSql).to.match(/DROP INDEX.*idx_old/i)
                    expect(upSql).to.match(/CREATE.*INDEX.*idx_new/i)
                }),
            )
        } finally {
            await closeTestingConnections(optedOutSources)
        }
    })
})
