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
                await expect(queryRunner.clearDatabase()).not.to.be.rejected
                await queryRunner.release()
            }),
        ))

    it("should not attempt to drop extension-owned views when pg_stat_statements is loaded", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()

                // Check if pg_stat_statements is available (requires shared_preload_libraries config)
                const extensions: { name: string }[] = await queryRunner.query(
                    `SELECT name FROM pg_available_extensions WHERE name = 'pg_stat_statements'`,
                )

                if (extensions.length === 0) {
                    // Extension not available in this environment; skip
                    await queryRunner.release()
                    return
                }

                try {
                    await queryRunner.query(
                        `CREATE EXTENSION IF NOT EXISTS pg_stat_statements`,
                    )
                } catch {
                    // Extension exists but can't be created without shared_preload_libraries; skip
                    await queryRunner.release()
                    return
                }

                try {
                    await expect(queryRunner.clearDatabase()).not.to.be.rejected
                } finally {
                    await queryRunner.query(
                        `DROP EXTENSION IF EXISTS pg_stat_statements`,
                    )
                    await queryRunner.release()
                }
            }),
        ))
})
