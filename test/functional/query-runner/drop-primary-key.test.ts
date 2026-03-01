import "reflect-metadata"
import { DataSource } from "../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"

describe("query runner > drop primary key", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should correctly drop primary key and revert drop", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                // CockroachDB does not allow dropping primary key
                if (
                    connection.driver.options.type === "cockroachdb" ||
                    connection.driver.options.type === "spanner"
                )
                    return

                const queryRunner = connection.createQueryRunner()

                let table = await queryRunner.getTable("post")
                table!.findColumnByName("id")!.isPrimary.should.be.true

                await queryRunner.dropPrimaryKey(table!)

                table = await queryRunner.getTable("post")
                table!.findColumnByName("id")!.isPrimary.should.be.false

                await queryRunner.executeMemoryDownSql()

                table = await queryRunner.getTable("post")
                table!.findColumnByName("id")!.isPrimary.should.be.true

                await queryRunner.release()
            }),
        ))
})
