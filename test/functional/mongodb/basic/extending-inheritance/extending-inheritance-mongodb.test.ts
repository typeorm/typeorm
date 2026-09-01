import "reflect-metadata"
import { expect } from "chai"
import type { DataSource } from "../../../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import { Article } from "./entity/Article"
import { FinalEntity } from "./entity/FinalEntity"

describe("table inheritance > mongodb > regular inheritance using extends keyword", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            enabledDrivers: ["mongodb"],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    // GitHub issue #7898 - Extending an entity does not override property decorators
    // MongoBaseEntity: none
    // Article: length=200
    it("should override property decorators when extending abstract class", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const articleMetadata = dataSource.getMetadata(Article)

                const descriptionColumn = articleMetadata.columns.find(
                    (col) => col.propertyName === "description",
                )

                expect(descriptionColumn).not.to.be.undefined
                expect(descriptionColumn!.length).to.equal("200")

                const article = new Article()
                article.description = "Test Article Description"
                article.title = "Test Title"
                await dataSource.manager.save(article)

                const loadedArticle = await dataSource.manager.findOne(
                    Article,
                    {
                        where: {
                            title: "Test Title",
                        },
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
            dataSources.map(async (dataSource) => {
                const finalMetadata = dataSource.getMetadata(FinalEntity)

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
                await dataSource.manager.save(entity1)

                const entity2 = new FinalEntity()
                entity2.description = "Second Description"
                entity2.status = "inactive"
                entity2.category = "test"
                await dataSource.manager.save(entity2)

                const loadedEntity = await dataSource.manager.findOne(
                    FinalEntity,
                    {
                        where: {
                            status: "active",
                        },
                    },
                )

                expect(loadedEntity).not.to.be.null
                expect(loadedEntity!.description).to.equal("First Description")
                expect(loadedEntity!.status).to.equal("active")
                expect(loadedEntity!.category).to.equal("test")
            }),
        ))
})
