import "reflect-metadata"
import { DataSource } from "../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"

describe("github issues > #3357 migration generation drops and creates columns instead of altering", () => {
    let connections: DataSource[]

    before(async () => {
        connections = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            enabledDrivers: ["postgres", "mysql", "mssql", "cockroachdb"],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should use ALTER COLUMN instead of DROP+ADD when changing column length to preserve data", () =>
        Promise.all(
            connections.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()

                try {
                    // Insert test data using repository API to avoid driver-specific quoting issues
                    const { TestEntity } = require("./entity/TestEntity")
                    await connection.getRepository(TestEntity).save({ name: "test-value" })

                    const table = await queryRunner.getTable("test_entity")
                    const nameColumn = table!.findColumnByName("name")!

                    // Change length from 50 to 100
                    const newColumn = nameColumn.clone()
                    newColumn.length = "100"

                    await queryRunner.changeColumn(table!, nameColumn, newColumn)

                    // Verify data is preserved after ALTER COLUMN
                    const rows = await connection.getRepository(TestEntity).find()
                    rows.should.have.length(1)
                    rows[0].name.should.equal("test-value")

                    // Verify the column was actually changed
                    const updatedTable = await queryRunner.getTable("test_entity")
                    const updatedColumn = updatedTable!.findColumnByName("name")!
                    updatedColumn.length.should.equal("100")
                } finally {
                    await queryRunner.release()
                }
            }),
        ))
})
