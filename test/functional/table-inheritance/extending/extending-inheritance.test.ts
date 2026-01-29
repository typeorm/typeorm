import "reflect-metadata"
import { expect } from "chai"
import { DataSource } from "../../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { Post } from "./entity/Post"
import { Article } from "./entity/Article"
import { FinalEntity } from "./entity/FinalEntity"
import { DriverUtils } from "../../../../src/driver/DriverUtils"

describe("table inheritance > regular inheritance using extends keyword", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should work correctly", () =>
        Promise.all(
            connections.map(async (connection) => {
                if (connection.driver.options.type === "mongodb") return
                const post = new Post()
                post.name = "Super title"
                post.text = "About this post"
                await connection.manager.save(post)

                const loadedPost = await connection.manager
                    .createQueryBuilder(Post, "post")
                    .where("post.id = :id", { id: 1 })
                    .getOne()

                expect(loadedPost).not.to.be.null
                expect(loadedPost!.name).not.to.be.undefined
                expect(loadedPost!.text).not.to.be.undefined
                loadedPost!.name.should.be.equal("Super title")
                loadedPost!.text.should.be.equal("About this post")
            }),
        ))

    // GitHub issue #7898 - Extending an entity does not override property decorators
    // AbstractBase: none
    // Article: title unique, nullable=false
    it("should override property decorators when extending abstract class", () =>
        Promise.all(
            connections.map(async (connection) => {
                // Skip MongoDB as it doesn't support SQL-style unique constraints
                if (connection.driver.options.type === "mongodb") return

                const articleMetadata = connection.getMetadata(Article)

                const titleColumn = articleMetadata.columns.find(
                    (col) => col.propertyName === "title",
                )

                expect(titleColumn).not.to.be.undefined
                expect(titleColumn!.isNullable).to.be.false

                // This is needed as some DBs (MySQL, MariaDB) store unique constraints as unique indices
                if (
                    DriverUtils.isMySQLFamily(connection.driver) ||
                    connection.driver.options.type === "aurora-mysql" ||
                    connection.driver.options.type === "sap" ||
                    connection.driver.options.type === "spanner"
                ) {
                    const titleIndex = articleMetadata.indices.find(
                        (index) =>
                            index.isUnique &&
                            index.columns.some(
                                (col) => col.propertyName === "title",
                            ),
                    )
                    expect(titleIndex).not.to.be.undefined
                } else {
                    const titleUnique = articleMetadata.uniques.find((unique) =>
                        unique.columns.some(
                            (col) => col.propertyName === "title",
                        ),
                    )
                    expect(titleUnique).not.to.be.undefined
                }

                const article = new Article()
                article.title = "Test Article"
                await connection.manager.save(article)

                const duplicateArticle = new Article()
                duplicateArticle.title = "Test Article"

                await expect(connection.manager.save(duplicateArticle)).to.be
                    .rejected

                const nullArticle = new Article()
                nullArticle.title = null as any

                await expect(connection.manager.save(nullArticle)).to.be
                    .rejected
            }),
        ))

    // BaseEntity: length=50, nullable=true
    // MiddleEntity: length=100, nullable=false
    // FinalEntity: length=200, nullable=false, unique=true
    it("should override property decorators through 3-level inheritance", () =>
        Promise.all(
            connections.map(async (connection) => {
                // Skip MongoDB as it doesn't support SQL-style unique constraints
                if (connection.driver.options.type === "mongodb") return

                const finalMetadata = connection.getMetadata(FinalEntity)
                const descriptionColumn = finalMetadata.columns.find(
                    (col) => col.propertyName === "description",
                )

                expect(descriptionColumn).not.to.be.undefined
                expect(descriptionColumn!.length).to.equal("200")
                expect(descriptionColumn!.isNullable).to.be.false

                // This is needed as some DBs (MySQL, MariaDB) store unique constraints as unique indices
                if (
                    DriverUtils.isMySQLFamily(connection.driver) ||
                    connection.driver.options.type === "aurora-mysql" ||
                    connection.driver.options.type === "sap" ||
                    connection.driver.options.type === "spanner"
                ) {
                    const descriptionIndex = finalMetadata.indices.find(
                        (index) =>
                            index.isUnique &&
                            index.columns.some(
                                (col) => col.propertyName === "description",
                            ),
                    )
                    expect(descriptionIndex).not.to.be.undefined
                } else {
                    const descriptionUnique = finalMetadata.uniques.find(
                        (unique) =>
                            unique.columns.some(
                                (col) => col.propertyName === "description",
                            ),
                    )
                    expect(descriptionUnique).not.to.be.undefined
                }

                const statusColumn = finalMetadata.columns.find(
                    (col) => col.propertyName === "status",
                )

                expect(statusColumn).not.to.be.undefined
                expect(statusColumn!.isNullable).to.be.false

                const entity1 = new FinalEntity()
                entity1.description = "First Description"
                entity1.status = "active"
                entity1.category = "test"
                await connection.manager.save(entity1)

                const entity2 = new FinalEntity()
                entity2.description = "First Description"
                entity2.status = "inactive"
                entity2.category = "test"

                await expect(connection.manager.save(entity2)).to.be.rejected

                const entity3 = new FinalEntity()
                entity3.description = null as any
                entity3.status = "active"
                entity3.category = "test"

                await expect(connection.manager.save(entity3)).to.be.rejected

                const entity4 = new FinalEntity()
                entity4.description = "Second Description"
                entity4.status = null as any
                entity4.category = "test"

                await expect(connection.manager.save(entity4)).to.be.rejected
            }),
        ))
})
