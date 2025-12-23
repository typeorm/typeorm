import "reflect-metadata"
import { DataSource } from "../../../src/data-source/DataSource"
import { UniqueMetadata } from "../../../src/metadata/UniqueMetadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { ForeignKeyMetadata } from "../../../src/metadata/ForeignKeyMetadata"

describe("schema builder > create foreign key", () => {
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
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should correctly create foreign key", () =>
        Promise.all(
            connections.map(async (connection) => {
                const categoryMetadata = connection.getMetadata("category")
                const postMetadata = connection.getMetadata("post")
                const columns = categoryMetadata.columns.filter(
                    (column) =>
                        ["postText", "postTag"].indexOf(column.propertyName) !==
                        -1,
                )
                const referencedColumns = postMetadata.columns.filter(
                    (column) =>
                        ["text", "tag"].indexOf(column.propertyName) !== -1,
                )

                const fkMetadata = new ForeignKeyMetadata({
                    entityMetadata: categoryMetadata,
                    referencedEntityMetadata: postMetadata,
                    columns: columns,
                    referencedColumns: referencedColumns,
                    namingStrategy: connection.namingStrategy,
                })
                categoryMetadata.foreignKeys.push(fkMetadata)

                // CockroachDB requires unique constraint for foreign key referenced columns
                if (connection.driver.options.type === "cockroachdb") {
                    const uniqueConstraint = new UniqueMetadata({
                        entityMetadata: categoryMetadata,
                        columns: fkMetadata.columns,
                        args: {
                            name: connection.namingStrategy.relationConstraintName(
                                categoryMetadata.tableName,
                                fkMetadata.columns.map((c) => c.databaseName),
                            ),
                            target: categoryMetadata.target,
                        },
                    })
                    categoryMetadata.uniques.push(uniqueConstraint)
                }

                await connection.synchronize()

                const queryRunner = connection.createQueryRunner()
                const table = await queryRunner.getTable("category")
                await queryRunner.release()

                table!.foreignKeys.length.should.be.equal(1)
                table!.indices.length.should.be.equal(0)
            }),
        ))
})
