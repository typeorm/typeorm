import "reflect-metadata"
import type { DataSource } from "../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../utils/test-utils"
import { ColumnMetadata } from "../../../src/metadata/ColumnMetadata"
import type { ColumnMetadataArgs } from "../../../src/metadata-args/ColumnMetadataArgs"
import { User } from "./entity/User"

describe("github issues > #1623 NOT NULL constraint failed after a new column is added (SQLite)", () => {
    let dataSources: DataSource[]
    beforeAll(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    afterAll(() => closeTestingConnections(dataSources))

    it("should correctly add new column", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                // Spanner does not support adding new NOT NULL column to existing table
                if (dataSource.driver.options.type === "spanner") return

                const userMetadata = dataSource.getMetadata(User)
                const columnMetadata = new ColumnMetadata({
                    entityMetadata: userMetadata,
                    args: <ColumnMetadataArgs>{
                        target: User,
                        propertyName: "userName",
                        mode: "regular",
                        options: {
                            type: "varchar",
                            name: "userName",
                        },
                    },
                })
                columnMetadata.build(dataSource)

                userMetadata.columns.push(columnMetadata)

                await dataSource.synchronize()

                const queryRunner = dataSource.createQueryRunner()
                const table = await queryRunner.getTable("user")
                const column1 = table!.findColumnByName("userName")!
                await queryRunner.release()

                column1.should.be.exist
            }),
        ))
})
