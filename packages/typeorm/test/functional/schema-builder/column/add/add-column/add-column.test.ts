import "reflect-metadata"
import type { DataSource } from "../../../../../../src"
import type { ColumnMetadataArgs } from "../../../../../../src/metadata-args/ColumnMetadataArgs"
import { ColumnMetadata } from "../../../../../../src/metadata/ColumnMetadata"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../../../../utils/test-utils"
import { Post } from "./entity/Post"
import { DriverUtils } from "../../../../../../src/driver/DriverUtils"

describe("schema builder > add column", () => {
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

    it("should correctly add column", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const postMetadata = dataSource.getMetadata("post")

                let numericType = "int"
                if (DriverUtils.isSQLiteFamily(dataSource.driver)) {
                    numericType = "integer"
                } else if (dataSource.driver.options.type === "spanner") {
                    numericType = "int64"
                }

                let stringType = "varchar"
                if (dataSource.driver.options.type === "sap") {
                    stringType = "nvarchar"
                } else if (dataSource.driver.options.type === "spanner") {
                    stringType = "string"
                }

                const columnMetadata1 = new ColumnMetadata({
                    entityMetadata: postMetadata,
                    args: <ColumnMetadataArgs>{
                        target: Post,
                        propertyName: "secondId",
                        mode: "regular",
                        options: {
                            type: numericType,
                            name: "secondId",
                            nullable:
                                dataSource.driver.options.type === "spanner",
                        },
                    },
                })
                columnMetadata1.build(dataSource)

                const columnMetadata2 = new ColumnMetadata({
                    entityMetadata: postMetadata,
                    args: <ColumnMetadataArgs>{
                        target: Post,
                        propertyName: "description",
                        mode: "regular",
                        options: {
                            type: stringType,
                            name: "description",
                            length: 100,
                            nullable:
                                dataSource.driver.options.type === "spanner",
                        },
                    },
                })
                columnMetadata2.build(dataSource)

                postMetadata.columns.push(...[columnMetadata1, columnMetadata2])

                await dataSource.synchronize()

                const queryRunner = dataSource.createQueryRunner()
                const table = await queryRunner.getTable("post")
                const column1 = table!.findColumnByName("secondId")!
                column1.should.be.exist
                if (dataSource.driver.options.type === "spanner") {
                    column1.isNullable.should.be.true
                } else {
                    column1.isNullable.should.be.false
                }

                const column2 = table!.findColumnByName("description")!
                column2.should.be.exist
                column2.length.should.be.equal("100")

                await queryRunner.release()
            }),
        ))
})
