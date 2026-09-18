import { expect } from "chai"
import type { DataSource } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { TestEntity } from "./entity/TestEntity"

describe("github issues > #12002 clearDatabase fails when extension-owned views/tables exist", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            entities: [TestEntity],
            enabledDrivers: ["postgres"],
            dropSchema: true,
            schemaCreate: true,
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should not fail when clearing a database that has no extension-owned objects", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()
                try {
                    await expect(queryRunner.clearDatabase()).not.to.be.rejected
                } finally {
                    await queryRunner.release()
                }
            }),
        ))

    // pg_buffercache creates an extension-owned view without needing shared_preload_libraries — reliable stand-in for any extension that owns relations.
    it("should not attempt to drop extension-owned views when pg_buffercache is loaded", async function () {
        for (const dataSource of dataSources) {
            const queryRunner = dataSource.createQueryRunner()

            const available: { name: string }[] = await queryRunner.query(
                `SELECT name FROM pg_available_extensions WHERE name = 'pg_buffercache'`,
            )

            if (available.length === 0) {
                await queryRunner.release()
                this.skip()
                return
            }

            try {
                await queryRunner.query(
                    `CREATE EXTENSION IF NOT EXISTS pg_buffercache`,
                )
                await expect(queryRunner.clearDatabase()).not.to.be.rejected
                // Verify the extension-owned view survived clearDatabase()
                await queryRunner.query(`SELECT 1 FROM pg_buffercache LIMIT 1`)
            } finally {
                await queryRunner.query(
                    `DROP EXTENSION IF EXISTS pg_buffercache`,
                )
                await queryRunner.release()
            }
        }
    })

    // PostGIS's spatial_ref_sys is an extension-owned regular table (relkind='r'). pg_buffercache only creates a view, so this test covers the table branch.
    it("should not attempt to drop extension-owned tables when postgis is loaded", async function () {
        for (const dataSource of dataSources) {
            const queryRunner = dataSource.createQueryRunner()

            const available: { name: string }[] = await queryRunner.query(
                `SELECT name FROM pg_available_extensions WHERE name = 'postgis'`,
            )

            if (available.length === 0) {
                await queryRunner.release()
                this.skip()
                return
            }

            try {
                await queryRunner.query(
                    `CREATE EXTENSION IF NOT EXISTS postgis`,
                )
                await expect(queryRunner.clearDatabase()).not.to.be.rejected
                // Verify the extension-owned table survived clearDatabase()
                await queryRunner.query(`SELECT 1 FROM spatial_ref_sys LIMIT 1`)
            } finally {
                await queryRunner.query(
                    `DROP EXTENSION IF EXISTS postgis CASCADE`,
                )
                await queryRunner.release()
            }
        }
    })
})
