import "reflect-metadata"
import type { DataSource } from "../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../utils/test-utils"

describe("query runner > has table", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    after(() => closeTestingConnections(dataSources))

    it("should return true for existing tables and false for non-existing", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await using queryRunner = dataSource.createQueryRunner()

                const hasPostTable = await queryRunner.hasTable("post")
                const hasPhotoTable = await queryRunner.hasTable("photo")
                const hasNonExistentTable =
                    await queryRunner.hasTable("non_existent_table")

                hasPostTable.should.be.true
                hasPhotoTable.should.be.true
                hasNonExistentTable.should.be.false
            }),
        ))
})
