import "reflect-metadata"
import type { DataSource } from "../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../utils/test-utils"

describe("query runner > has column", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            disabledDrivers: ["spanner"],
            entities: [__dirname + "/entity/*{.js,.ts}"],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    after(() => closeTestingConnections(dataSources))

    it("should correctly check if column exist", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()

                const hasIdColumn = await queryRunner.hasColumn("post", "id")
                const hasNameColumn = await queryRunner.hasColumn(
                    "post",
                    "name",
                )
                const hasVersionColumn = await queryRunner.hasColumn(
                    "post",
                    "version",
                )
                const hasDescriptionColumn = await queryRunner.hasColumn(
                    "post",
                    "description",
                )

                hasIdColumn.should.be.true
                hasNameColumn.should.be.true
                hasVersionColumn.should.be.true
                hasDescriptionColumn.should.be.false

                await queryRunner.release()
            }),
        ))
})
