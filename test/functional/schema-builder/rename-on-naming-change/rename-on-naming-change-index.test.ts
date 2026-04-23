import "reflect-metadata"
import { expect } from "chai"
import type { DataSource } from "../../../../src"
import { EntitySchema } from "../../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../../utils/test-utils"
import {
    expectNoDropOfName,
    expectSyncIsIdempotent,
    getIndexNames,
} from "./rename-on-naming-change-helpers"

// Shared "new" entity — what the metadata wants after the naming-strategy /
// renamed / custom-name change. Seed flows drive the DB away from this state
// so the sync reconciler sees drift.
const UserNewNames = new EntitySchema({
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

describe("schema builder > rename on naming change > index", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            entities: [UserNewNames],
            schemaCreate: false,
            dropSchema: true,
        })
    })

    after(() => closeTestingConnections(dataSources))

    /**
     * Seed: `synchronize()` creates the table with the "new" names; then the
     * index is renamed server-side to the drift target. The next sync sees
     * DB-has-`oldName` / metadata-wants-`idx_new` and exercises the reconciler.
     */
    async function seedIndexUnderOldName(
        dataSource: DataSource,
        oldName: string,
    ): Promise<void> {
        await dataSource.synchronize()
        const qr = dataSource.createQueryRunner()
        try {
            const table = await qr.getTable("rc_user")
            expect(
                table?.indices.some((i) => i.name === "idx_new"),
                `seed expected idx_new on ${dataSource.driver.options.type}`,
            ).to.be.true
            await qr.renameIndex!("rc_user", "idx_new", oldName)
        } finally {
            await qr.release()
        }
    }

    it("custom → different custom: rename, no DROP of old name", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await seedIndexUnderOldName(dataSource, "idx_old")

                const log = await dataSource.driver.createSchemaBuilder().log()
                expectNoDropOfName(log.upQueries, "idx_old")

                await dataSource.synchronize()
                const names = await getIndexNames(dataSource, "rc_user")
                expect(names, dataSource.driver.options.type).to.include(
                    "idx_new",
                )
                expect(names, dataSource.driver.options.type).to.not.include(
                    "idx_old",
                )
            }),
        ))

    it("second sync after renaming drifted index is idempotent", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await seedIndexUnderOldName(dataSource, "idx_old")
                await dataSource.synchronize()

                await expectSyncIsIdempotent(dataSource)
            }),
        ))
})
