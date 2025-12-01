import "reflect-metadata"
import { DataSource } from "../../../src"
import { ColumnMetadataArgs } from "../../../src/metadata-args/ColumnMetadataArgs"
import { ColumnMetadata } from "../../../src/metadata/ColumnMetadata"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../utils/test-utils"
import { DriverUtils } from "../../../src/driver/DriverUtils"

describe("schema builder > add column", () => {
    let connections: DataSource[]
    before(async () => {
        connections = await createTestingConnections({
            entities: [
                __dirname + "/entity/common/*{.js,.ts}",
                __dirname + "/entity/:driver:/*{.js,.ts}",
            ],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    after(() => closeTestingConnections(connections))

    it("should correctly add column", () =>
        Promise.all(
            connections.map(async (connection) => {
                const postMetadata = connection.getMetadata("post")

                let numericType = "int"
                if (DriverUtils.isSQLiteFamily(connection.driver)) {
                    numericType = "integer"
                } else if (connection.driver.options.type === "spanner") {
                    numericType = "int64"
                }

                let stringType = "varchar"
                if (connection.driver.options.type === "sap") {
                    stringType = "nvarchar"
                } else if (connection.driver.options.type === "spanner") {
                    stringType = "string"
                }

                const columnMetadata1 = new ColumnMetadata({
                    connection: connection,
                    entityMetadata: postMetadata!,
                    args: <ColumnMetadataArgs>{
                        target: "Post",
                        propertyName: "secondId",
                        mode: "regular",
                        options: {
                            type: numericType,
                            name: "secondId",
                            nullable:
                                connection.driver.options.type === "spanner"
                                    ? true
                                    : false,
                        },
                    },
                })
                columnMetadata1.build(connection)

                const columnMetadata2 = new ColumnMetadata({
                    connection: connection,
                    entityMetadata: postMetadata!,
                    args: <ColumnMetadataArgs>{
                        target: "Post",
                        propertyName: "description",
                        mode: "regular",
                        options: {
                            type: stringType,
                            name: "description",
                            length: 100,
                            nullable:
                                connection.driver.options.type === "spanner"
                                    ? true
                                    : false,
                        },
                    },
                })
                columnMetadata2.build(connection)

                postMetadata.columns.push(...[columnMetadata1, columnMetadata2])

                await connection.synchronize()

                const queryRunner = connection.createQueryRunner()
                const table = await queryRunner.getTable("post")
                const column1 = table!.findColumnByName("secondId")!
                column1.should.be.exist
                if (connection.driver.options.type === "spanner") {
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
