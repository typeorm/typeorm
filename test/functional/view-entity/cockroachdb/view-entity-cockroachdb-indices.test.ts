import { expect } from "chai"
import "reflect-metadata"
import { DataSource, TableIndex, TypeORMError } from "../../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../../utils/test-utils"
import { PostByCategory } from "./entity/PostByCategory"
import { CockroachQueryRunner } from "../../../../src/driver/cockroachdb/CockroachQueryRunner"
import { IndexMetadata } from "../../../../src/metadata/IndexMetadata"

describe.only("view entity > cockroachdb > materialized view indices", () => {
    const tableIndex: TableIndex = new TableIndex({
        columnNames: ["categoryName"],
        name: "category_name_idx",
        type: "btree",
    })

    let dataSources: DataSource[]
    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                schemaCreate: true,
                dropSchema: true,
                enabledDrivers: ["cockroachdb"],
            })),
    )
    after(() => closeTestingConnections(dataSources))

    it("should create a materialized view index at runtime", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner =
                    dataSource.createQueryRunner() as CockroachQueryRunner
                const view = await queryRunner.getView("post_by_category")
                await queryRunner.release()

                expect(view!.indices[0]).to.deep.equal(tableIndex)
            }),
        ))

    it("should rename a materialized view index", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const postByCategoryMetadata =
                    dataSource.getMetadata(PostByCategory)
                postByCategoryMetadata.indices[0].name = "renamed_idx"

                await dataSource.synchronize()

                const queryRunner =
                    dataSource.createQueryRunner() as CockroachQueryRunner
                const view = await queryRunner.getView("post_by_category")
                await queryRunner.release()

                const index = view!.indices.find(
                    (i) => i.name === "renamed_idx",
                )
                expect(index).not.to.be.undefined
            }),
        ))

    it("should delete a materialized view index", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const postByCategoryMetadata =
                    dataSource.getMetadata(PostByCategory)
                postByCategoryMetadata.indices.splice(0, 1)

                await dataSource.synchronize()

                const queryRunner =
                    dataSource.createQueryRunner() as CockroachQueryRunner
                const view = await queryRunner.getView("post_by_category")
                await queryRunner.release()

                expect(view!.indices.length).to.equal(0)
            }),
        ))

    it("should create a materialized view index programmatically", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const postByCategoryMetadata =
                    dataSource.getMetadata(PostByCategory)
                const categoryNameColumn =
                    postByCategoryMetadata.findColumnWithPropertyName(
                        "categoryName",
                    )!
                const indexMetadata = new IndexMetadata({
                    entityMetadata: postByCategoryMetadata,
                    columns: [categoryNameColumn],
                    args: {
                        target: PostByCategory,
                        synchronize: true,
                        name: "category_name_ix",
                    },
                })
                indexMetadata.build(dataSource.namingStrategy)
                postByCategoryMetadata.indices.push(indexMetadata)

                await dataSource.synchronize()

                const queryRunner =
                    dataSource.createQueryRunner() as CockroachQueryRunner
                const view = await queryRunner.getView("post_by_category")
                await queryRunner.release()

                expect(view!.indices.length).to.equal(1)

                postByCategoryMetadata.indices.splice(
                    postByCategoryMetadata.indices.indexOf(indexMetadata),
                    1,
                )
            }),
        ))

    it("should create a materialized view unique index", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const postByCategoryMetadata =
                    dataSource.getMetadata(PostByCategory)
                const categoryNameColumn =
                    postByCategoryMetadata.findColumnWithPropertyName(
                        "categoryName",
                    )!
                const indexMetadata = new IndexMetadata({
                    entityMetadata: postByCategoryMetadata,
                    columns: [categoryNameColumn],
                    args: {
                        target: PostByCategory,
                        synchronize: true,
                        name: "category_name_ix",
                        unique: true,
                    },
                })
                indexMetadata.build(dataSource.namingStrategy)
                postByCategoryMetadata.indices.push(indexMetadata)

                await dataSource.synchronize()

                const queryRunner =
                    dataSource.createQueryRunner() as CockroachQueryRunner
                const view = await queryRunner.getView("post_by_category")
                await queryRunner.release()

                const index = view!.indices.find(
                    (i) => i.name === "category_name_ix",
                )
                expect(index!.isUnique).to.be.true

                postByCategoryMetadata.indices.splice(
                    postByCategoryMetadata.indices.indexOf(indexMetadata),
                    1,
                )
            }),
        ))

    it("should load a multi-column index", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const postByCategoryMetadata =
                    dataSource.getMetadata(PostByCategory)
                postByCategoryMetadata.indices.length = 0
                await dataSource.synchronize()

                const categoryNameColumn =
                    postByCategoryMetadata.findColumnWithPropertyName(
                        "categoryName",
                    )!
                const postCountColumn =
                    postByCategoryMetadata.findColumnWithPropertyName(
                        "postCount",
                    )!
                const indexMetadata = new IndexMetadata({
                    entityMetadata: postByCategoryMetadata,
                    columns: [categoryNameColumn, postCountColumn],
                    args: {
                        target: PostByCategory,
                        synchronize: true,
                        name: "multi_col_idx",
                    },
                })
                indexMetadata.build(dataSource.namingStrategy)
                postByCategoryMetadata.indices.push(indexMetadata)

                await dataSource.synchronize()

                const queryRunner =
                    dataSource.createQueryRunner() as CockroachQueryRunner
                const view = await queryRunner.getView("post_by_category")
                await queryRunner.release()

                const index = view!.indices.find(
                    (i) => i.name === "multi_col_idx",
                )
                expect(index!.columnNames).to.have.members([
                    "categoryName",
                    "postCount",
                ])

                postByCategoryMetadata.indices.splice(
                    postByCategoryMetadata.indices.indexOf(indexMetadata),
                    1,
                )
            }),
        ))

    it("should not create duplicate indices on re-synchronize", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const postByCategoryMetadata =
                    dataSource.getMetadata(PostByCategory)
                postByCategoryMetadata.indices.length = 0
                await dataSource.synchronize()

                const categoryNameColumn =
                    postByCategoryMetadata.findColumnWithPropertyName(
                        "categoryName",
                    )!
                const indexMetadata = new IndexMetadata({
                    entityMetadata: postByCategoryMetadata,
                    columns: [categoryNameColumn],
                    args: {
                        target: PostByCategory,
                        synchronize: true,
                        name: "idempotent_idx",
                    },
                })
                indexMetadata.build(dataSource.namingStrategy)
                postByCategoryMetadata.indices.push(indexMetadata)

                await dataSource.synchronize()
                await dataSource.synchronize()

                const queryRunner =
                    dataSource.createQueryRunner() as CockroachQueryRunner
                const view = await queryRunner.getView("post_by_category")
                await queryRunner.release()

                const matches = view!.indices.filter(
                    (i) => i.name === "idempotent_idx",
                )
                expect(matches.length).to.equal(1)

                postByCategoryMetadata.indices.splice(
                    postByCategoryMetadata.indices.indexOf(indexMetadata),
                    1,
                )
            }),
        ))

    it("should throw when dropping a non-existent view index", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner =
                    dataSource.createQueryRunner() as CockroachQueryRunner
                const view = await queryRunner.getView("post_by_category")

                try {
                    await queryRunner.dropViewIndex(view!, "non_existent_idx")
                    expect.fail("should have thrown")
                } catch (err) {
                    expect(err).to.be.instanceOf(TypeORMError)
                } finally {
                    await queryRunner.release()
                }
            }),
        ))
})
