import "reflect-metadata"
import { expect } from "chai"
import type { DataSource } from "../../../../src"
import { EntitySchema, TableExclusion } from "../../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../../utils/test-utils"
import {
    expectNoDropOfName,
    expectSyncIsIdempotent,
} from "./rename-on-naming-change-helpers"

// Exclusion constraints are a Postgres-only feature. CockroachDB doesn't
// implement `CREATE CONSTRAINT ... EXCLUDE`; the other supported drivers
// don't model exclusions at all.
const ENABLED_DRIVERS = ["postgres"] as const

async function getExclusionNames(
    dataSource: DataSource,
    tableName: string,
): Promise<string[]> {
    const qr = dataSource.createQueryRunner()
    try {
        const table = await qr.getTable(tableName)
        return table?.exclusions.map((e) => e.name ?? "") ?? []
    } finally {
        await qr.release()
    }
}

const MeetingNewExclusion = new EntitySchema<any>({
    name: "rc_xcl_meeting",
    tableName: "rc_xcl_meeting",
    columns: {
        id: { type: Number, primary: true },
        starts_at: { type: "timestamp", nullable: false },
        finishes_at: { type: "timestamp", nullable: false },
    },
    exclusions: [
        {
            name: "xcl_new",
            expression: `USING gist (tsrange("starts_at", "finishes_at") WITH &&)`,
        },
    ],
})

describe("schema builder > rename on naming change > exclusion", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            enabledDrivers: [...ENABLED_DRIVERS],
            entities: [MeetingNewExclusion],
            schemaCreate: false,
            dropSchema: true,
        })
    })

    after(() => closeTestingConnections(dataSources))

    async function seedExclusionUnderOldName(
        dataSource: DataSource,
        oldName: string,
    ): Promise<void> {
        await dataSource.synchronize()
        const qr = dataSource.createQueryRunner()
        try {
            const table = await qr.getTable("rc_xcl_meeting")
            expect(
                table?.exclusions.some((e) => e.name === "xcl_new"),
                `seed expected xcl_new on ${dataSource.driver.options.type}`,
            ).to.be.true
            await qr.renameExclusionConstraint!(
                "rc_xcl_meeting",
                "xcl_new",
                oldName,
            )
        } finally {
            await qr.release()
        }
    }

    it("custom → different custom: rename, no DROP of old name", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await seedExclusionUnderOldName(dataSource, "xcl_old")

                const log = await dataSource.driver.createSchemaBuilder().log()
                expectNoDropOfName(log.upQueries, "xcl_old")

                await dataSource.synchronize()
                const names = await getExclusionNames(
                    dataSource,
                    "rc_xcl_meeting",
                )
                expect(names, dataSource.driver.options.type).to.include(
                    "xcl_new",
                )
                expect(names, dataSource.driver.options.type).to.not.include(
                    "xcl_old",
                )
            }),
        ))

    it("second sync after renaming the exclusion is idempotent", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await seedExclusionUnderOldName(dataSource, "xcl_old")
                await dataSource.synchronize()

                await expectSyncIsIdempotent(dataSource)
            }),
        ))
})

// Duplicate-on-db scenario: two exclusion constraints on the same expression
// under different names; metadata declares one. The reconciler pairs one as
// a rename and leaves the other for the drop pass.
const MeetingDupExclusion = new EntitySchema<any>({
    name: "rc_xcl_dup",
    tableName: "rc_xcl_dup",
    columns: {
        id: { type: Number, primary: true },
        starts_at: { type: "timestamp", nullable: false },
        finishes_at: { type: "timestamp", nullable: false },
    },
    exclusions: [
        {
            name: "xcl_new",
            expression: `USING gist (tsrange("starts_at", "finishes_at") WITH &&)`,
        },
    ],
})

describe("schema builder > rename on naming change > exclusion (db duplicates)", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            enabledDrivers: [...ENABLED_DRIVERS],
            entities: [MeetingDupExclusion],
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
                    await qr.renameExclusionConstraint!(
                        "rc_xcl_dup",
                        "xcl_new",
                        "xcl_old1",
                    )
                    await qr.createExclusionConstraint(
                        "rc_xcl_dup",
                        new TableExclusion({
                            name: "xcl_old2",
                            expression: `USING gist (tsrange("starts_at", "finishes_at") WITH &&)`,
                        }),
                    )
                } finally {
                    await qr.release()
                }

                const log = await dataSource.driver.createSchemaBuilder().log()
                expectNoDropOfName(log.upQueries, "xcl_old1")

                await dataSource.synchronize()
                const names = await getExclusionNames(dataSource, "rc_xcl_dup")
                expect(names, dataSource.driver.options.type).to.include(
                    "xcl_new",
                )
                expect(names, dataSource.driver.options.type).to.not.include(
                    "xcl_old1",
                )
                expect(names, dataSource.driver.options.type).to.not.include(
                    "xcl_old2",
                )

                await expectSyncIsIdempotent(dataSource)
            }),
        ))
})
