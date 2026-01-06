import { DataSource } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { expect } from "chai"

describe("github issues > #10991", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            enabledDrivers: ["cockroachdb", "postgres"],
        })
    })

    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should successfully load tables with special characters using quote_ident", async () => {
        for (const dataSource of dataSources) {
            const queryRunner = dataSource.createQueryRunner()

            const tableName = 'My "Special" Table\'s Name'
            const escapedTableName = `"${tableName.replace(/"/g, '""')}"`

            await queryRunner.query(
                `CREATE TABLE ${escapedTableName} (id SERIAL PRIMARY KEY)`,
            )

            try {
                const tables = await queryRunner.getTables([tableName])
                expect(tables.length).to.equal(1)
                expect(tables[0].name).to.equal(tableName)
            } finally {
                await queryRunner.query(`DROP TABLE ${escapedTableName}`)
                await queryRunner.release()
            }
        }
    })

    it("should successfully clear database with tables having special characters using quote_ident", async () => {
        for (const dataSource of dataSources) {
            const queryRunner = dataSource.createQueryRunner()

            const tableName = 'My "Special" Table\'s Name'
            const escapedTableName = `"${tableName.replace(/"/g, '""')}"`

            await queryRunner.query(
                `CREATE TABLE ${escapedTableName} (id SERIAL PRIMARY KEY)`,
            )

            try {
                await queryRunner.clearDatabase()
                const result = await queryRunner.query(
                    `SELECT * FROM information_schema.tables WHERE table_name = $1`,
                    [tableName],
                )
                expect(result.length).to.equal(0)
            } finally {
                if (!queryRunner.isReleased) {
                    await queryRunner.release()
                }
            }
        }
    })
})
