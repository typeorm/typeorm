import "reflect-metadata"
import { expect } from "chai"
import { DataSource } from "../../../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import { Article } from "./entity/Article"
import { FinalEntity } from "./entity/FinalEntity"

describe("table inheritance > mongodb > regular inheritance using extends keyword", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                enabledDrivers: ["mongodb"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    // MongoBaseEntity: none
    // Article: length=200
    it("should override property decorators when extending abstract class", () =>
        Promise.all(
            connections.map(async (connection) => {
                const articleMetadata = connection.getMetadata(Article)

                const descriptionColumn = articleMetadata.columns.find(
                    (col) => col.propertyName === "description",
                )

                expect(descriptionColumn).not.to.be.undefined
                expect(descriptionColumn!.length).to.equal("200")

                const article = new Article()
                article.description = "Test Article Description"
                article.title = "Test Title"
                await connection.manager.save(article)

                const loadedArticle = await connection.manager.findOne(
                    Article,
                    {
                        where: {
                            title: "Test Title",
                        } as any,
                    },
                )

                expect(loadedArticle).not.to.be.null
                expect(loadedArticle!.description).to.equal(
                    "Test Article Description",
                )
                expect(loadedArticle!.title).to.equal("Test Title")
            }),
        ))

    // MongoBaseEntity: none
    // MiddleEntity: length=100
    // FinalEntity: length=250
    it("should override property decorators through 3-level inheritance", () =>
        Promise.all(
            connections.map(async (connection) => {
                const finalMetadata = connection.getMetadata(FinalEntity)

                const descriptionColumn = finalMetadata.columns.find(
                    (col) => col.propertyName === "description",
                )

                expect(descriptionColumn).not.to.be.undefined
                expect(descriptionColumn!.length).to.equal("250")

                const statusColumn = finalMetadata.columns.find(
                    (col) => col.propertyName === "status",
                )

                expect(statusColumn).not.to.be.undefined

                const entity1 = new FinalEntity()
                entity1.description = "First Description"
                entity1.status = "active"
                entity1.category = "test"
                await connection.manager.save(entity1)

                const entity2 = new FinalEntity()
                entity2.description = "Second Description"
                entity2.status = "inactive"
                entity2.category = "test"
                await connection.manager.save(entity2)

                const loadedEntity = await connection.manager.findOne(
                    FinalEntity,
                    {
                        where: {
                            status: "active",
                        } as any,
                    },
                )

                expect(loadedEntity).not.to.be.null
                expect(loadedEntity!.description).to.equal("First Description")
                expect(loadedEntity!.status).to.equal("active")
                expect(loadedEntity!.category).to.equal("test")
            }),
        ))
})
