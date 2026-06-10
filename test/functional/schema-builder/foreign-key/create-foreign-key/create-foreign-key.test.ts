import "reflect-metadata"
import type { DataSource } from "../../../../../src/data-source/DataSource"
import { UniqueMetadata } from "../../../../../src/metadata/UniqueMetadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import { ForeignKeyMetadata } from "../../../../../src/metadata/ForeignKeyMetadata"

describe("schema builder > create foreign key", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            disabledDrivers: ["spanner"],
            entities: [__dirname + "/entity/*{.js,.ts}"],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should correctly create foreign key", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const categoryMetadata = dataSource.getMetadata("category")
                const postMetadata = dataSource.getMetadata("post")
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
                    namingStrategy: dataSource.namingStrategy,
                })
                categoryMetadata.foreignKeys.push(fkMetadata)

                // CockroachDB requires unique constraint for foreign key referenced columns
                if (dataSource.driver.options.type === "cockroachdb") {
                    const uniqueConstraint = new UniqueMetadata({
                        entityMetadata: categoryMetadata,
                        columns: fkMetadata.columns,
                        args: {
                            name: dataSource.namingStrategy.relationConstraintName(
                                categoryMetadata.tableName,
                                fkMetadata.columns.map((c) => c.databaseName),
                            ),
                            target: categoryMetadata.target,
                        },
                    })
                    categoryMetadata.uniques.push(uniqueConstraint)
                }

                await dataSource.synchronize()

                const queryRunner = dataSource.createQueryRunner()
                const table = await queryRunner.getTable("category")
                await queryRunner.release()

                table!.foreignKeys.length.should.be.equal(1)
                table!.indices.length.should.be.equal(0)
            }),
        ))
})
