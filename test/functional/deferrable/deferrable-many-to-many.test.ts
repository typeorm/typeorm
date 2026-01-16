import "reflect-metadata"
import { expect } from "chai"

import { DataSource } from "../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"

import { Post } from "./entity/Post"
import { Category } from "./entity/Category"
import { Article } from "./entity/Article"
import { Tag } from "./entity/Tag"

describe("deferrable foreign key constraint > many-to-many", () => {
    describe("bidirectional with deferrable on both sides", () => {
        let connections: DataSource[]
        before(
            async () =>
                (connections = await createTestingConnections({
                    entities: [Post, Category],
                    enabledDrivers: [
                        "better-sqlite3",
                        "postgres",
                        "sap",
                        "sqlite",
                    ],
                })),
        )
        beforeEach(() => reloadTestingDatabases(connections))
        after(() => closeTestingConnections(connections))

        it("should apply deferrable option to both junction table foreign keys", () =>
            Promise.all(
                connections.map(async (connection) => {
                    const junctionTableMetadata =
                        connection.entityMetadatas.find(
                            (metadata) =>
                                metadata.tableType === "junction" &&
                                metadata.tableName.includes("post") &&
                                metadata.tableName.includes("categor"),
                        )

                    expect(junctionTableMetadata).to.exist
                    expect(junctionTableMetadata!.foreignKeys).to.have.length(2)

                    for (const foreignKey of junctionTableMetadata!
                        .foreignKeys) {
                        expect(
                            foreignKey.deferrable,
                            `Foreign key ${foreignKey.name} should have deferrable set to INITIALLY DEFERRED`,
                        ).to.equal("INITIALLY DEFERRED")
                    }
                }),
            ))

        it("should defer constraint validation until end of transaction", () =>
            Promise.all(
                connections.map(async (connection) => {
                    await connection.manager.transaction(
                        async (entityManager) => {
                            const post = new Post()
                            post.id = 1
                            post.title = "Test Post"

                            const category = new Category()
                            category.id = 100
                            category.name = "Test Category"

                            post.categories = [category]

                            await entityManager.save(post)
                            await entityManager.save(category)
                        },
                    ).should.not.be.rejected

                    const post = await connection.manager.findOne(Post, {
                        relations: { categories: true },
                        where: { id: 1 },
                    })

                    expect(post).to.deep.equal({
                        id: 1,
                        title: "Test Post",
                        categories: [
                            {
                                id: 100,
                                name: "Test Category",
                            },
                        ],
                    })
                }),
            ))
    })

    describe("unidirectional with deferrable on owning side only", () => {
        let connections: DataSource[]
        before(
            async () =>
                (connections = await createTestingConnections({
                    entities: [Article, Tag],
                    enabledDrivers: [
                        "better-sqlite3",
                        "postgres",
                        "sap",
                        "sqlite",
                    ],
                })),
        )
        beforeEach(() => reloadTestingDatabases(connections))
        after(() => closeTestingConnections(connections))

        it("should apply deferrable to owning side FK and undefined to inverse side FK", () =>
            Promise.all(
                connections.map(async (connection) => {
                    const junctionTableMetadata =
                        connection.entityMetadatas.find(
                            (metadata) =>
                                metadata.tableType === "junction" &&
                                metadata.tableName.includes("article") &&
                                metadata.tableName.includes("tag"),
                        )

                    expect(junctionTableMetadata).to.exist
                    expect(junctionTableMetadata!.foreignKeys).to.have.length(2)

                    const articleFk = junctionTableMetadata!.foreignKeys.find(
                        (fk) =>
                            fk.referencedEntityMetadata.tableName === "article",
                    )
                    const tagFk = junctionTableMetadata!.foreignKeys.find(
                        (fk) => fk.referencedEntityMetadata.tableName === "tag",
                    )

                    expect(articleFk).to.exist
                    expect(tagFk).to.exist

                    expect(
                        articleFk!.deferrable,
                        "FK to Article (owning side) should have deferrable",
                    ).to.equal("INITIALLY DEFERRED")

                    expect(
                        tagFk!.deferrable,
                        "FK to Tag (no inverse relation) should not have deferrable",
                    ).to.be.undefined
                }),
            ))
    })
})
