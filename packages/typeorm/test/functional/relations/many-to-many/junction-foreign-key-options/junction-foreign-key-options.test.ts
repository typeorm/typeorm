import "reflect-metadata"
import { expect } from "chai"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import type { DataSource } from "../../../../../src"
import {
    EntitySchema,
    QueryFailedError,
    TypeORMError,
} from "../../../../../src"
import type { EntityMetadata } from "../../../../../src"
import type { ForeignKeyMetadata } from "../../../../../src/metadata/ForeignKeyMetadata"
import { Author } from "./entity/Author"
import { Book } from "./entity/Book"
import { Post } from "./entity/Post"
import { Topic } from "./entity/Topic"
import { Article } from "./entity-unsupported/Article"
import { Tag } from "./entity-unsupported/Tag"

function junctionForeignKeys(
    metadata: EntityMetadata,
    propertyName: string,
): { owner: ForeignKeyMetadata; inverse: ForeignKeyMetadata } {
    const relation = metadata.findRelationWithPropertyPath(propertyName)!
    const junction = relation.junctionEntityMetadata!
    const owner = junction.foreignKeys.find(
        (fk) => fk.referencedEntityMetadata === relation.entityMetadata,
    )!
    const inverse = junction.foreignKeys.find(
        (fk) => fk.referencedEntityMetadata === relation.inverseEntityMetadata,
    )!
    return { owner, inverse }
}

// https://github.com/typeorm/typeorm/issues/12870
describe("relations > many-to-many > junction foreign key options (#12870)", () => {
    describe("decorators", () => {
        let dataSources: DataSource[]

        before(async () => {
            dataSources = await createTestingConnections({
                entities: [Post, Topic, Author, Book],
                disabledDrivers: ["spanner"],
            })
        })
        beforeEach(() => reloadTestingDatabases(dataSources))
        after(() => closeTestingConnections(dataSources))

        it("should apply inverseJoinColumn options to the inverse junction foreign key", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const cascadeUpdate =
                        dataSource.driver.options.type === "oracle"
                            ? "NO ACTION"
                            : "CASCADE"
                    const { owner, inverse } = junctionForeignKeys(
                        dataSource.getMetadata(Post),
                        "topics",
                    )

                    expect(owner.onDelete).to.equal("CASCADE")
                    expect(owner.onUpdate).to.equal(cascadeUpdate)
                    expect(inverse.onDelete).to.equal("NO ACTION")
                    expect(inverse.onUpdate).to.equal("NO ACTION")
                }),
            ))

        it("should apply joinColumn options to the owner junction foreign key", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const cascadeUpdate =
                        dataSource.driver.options.type === "oracle"
                            ? "NO ACTION"
                            : "CASCADE"
                    const { owner, inverse } = junctionForeignKeys(
                        dataSource.getMetadata(Post),
                        "restrictedTopics",
                    )

                    expect(owner.onDelete).to.equal("NO ACTION")
                    expect(owner.onUpdate).to.equal("NO ACTION")
                    expect(inverse.onDelete).to.equal("CASCADE")
                    expect(inverse.onUpdate).to.equal(cascadeUpdate)
                }),
            ))

        it("should prefer relation options over joinColumn options", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const { owner, inverse } = junctionForeignKeys(
                        dataSource.getMetadata(Post),
                        "overriddenTopics",
                    )

                    expect(owner.onDelete).to.equal("NO ACTION")
                    expect(owner.onUpdate).to.equal("NO ACTION")
                    // no inverse relation exists, so the inverseJoinColumn options apply
                    expect(inverse.onDelete).to.equal("NO ACTION")
                    expect(inverse.onUpdate).to.equal("NO ACTION")
                }),
            ))

        it("should prefer inverse relation options over inverseJoinColumn options", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const { inverse } = junctionForeignKeys(
                        dataSource.getMetadata(Author),
                        "books",
                    )

                    expect(inverse.onDelete).to.equal("NO ACTION")
                    expect(inverse.onUpdate).to.equal("NO ACTION")
                    expect(inverse.deferrable).to.equal("INITIALLY DEFERRED")
                }),
            ))

        it("should apply deferrable per junction foreign key", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const { owner, inverse } = junctionForeignKeys(
                        dataSource.getMetadata(Post),
                        "deferredTopics",
                    )

                    expect(owner.deferrable).to.equal("INITIALLY DEFERRED")
                    expect(inverse.deferrable).to.equal("INITIALLY IMMEDIATE")
                }),
            ))

        it("should enforce the inverse junction foreign key in the database", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const topic = await dataSource.manager.save(Topic, {
                        name: "typeorm",
                    })
                    const post = await dataSource.manager.save(Post, {
                        topics: [topic],
                    })

                    // deleting a topic that is still assigned to a post must fail
                    await expect(
                        dataSource.manager.delete(Topic, topic.id),
                    ).to.be.rejectedWith(QueryFailedError)

                    // deleting the post removes its junction rows
                    await dataSource.manager.delete(Post, post.id)
                    const rows = await dataSource
                        .createQueryBuilder()
                        .select()
                        .from("post_topics", "pt")
                        .getRawMany()
                    expect(rows).to.have.length(0)
                }),
            ))
    })

    describe("schema synchronization", () => {
        let dataSources: DataSource[]

        before(async () => {
            dataSources = await createTestingConnections({
                entities: [Post, Topic, Author, Book],
                enabledDrivers: ["postgres"],
            })
        })
        beforeEach(() => reloadTestingDatabases(dataSources))
        after(() => closeTestingConnections(dataSources))

        it("should create the junction foreign keys with the given options", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const queryRunner = dataSource.createQueryRunner()
                    const postTopics =
                        (await queryRunner.getTable("post_topics"))!
                    const deferredTopics = (await queryRunner.getTable(
                        "post_deferred_topics",
                    ))!
                    await queryRunner.release()

                    const topicFk = postTopics.foreignKeys.find(
                        (fk) => fk.referencedTableName === "topic",
                    )!
                    expect(topicFk.onDelete).to.equal("NO ACTION")
                    expect(topicFk.onUpdate).to.equal("NO ACTION")

                    const postFk = postTopics.foreignKeys.find(
                        (fk) => fk.referencedTableName === "post",
                    )!
                    expect(postFk.onDelete).to.equal("CASCADE")
                    expect(postFk.onUpdate).to.equal("CASCADE")

                    const deferredPostFk = deferredTopics.foreignKeys.find(
                        (fk) => fk.referencedTableName === "post",
                    )!
                    expect(deferredPostFk.deferrable).to.equal(
                        "INITIALLY DEFERRED",
                    )
                    const deferredTopicFk = deferredTopics.foreignKeys.find(
                        (fk) => fk.referencedTableName === "topic",
                    )!
                    expect(deferredTopicFk.deferrable).to.equal(
                        "INITIALLY IMMEDIATE",
                    )
                }),
            ))

        it("should not generate schema changes after synchronization", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const sqlInMemory = await dataSource.driver
                        .createSchemaBuilder()
                        .log()
                    expect(sqlInMemory.upQueries).to.be.empty
                    expect(sqlInMemory.downQueries).to.be.empty
                }),
            ))
    })

    describe("entity schema", () => {
        const TagSchema = new EntitySchema<{ id: number }>({
            name: "tag",
            columns: {
                id: { type: Number, primary: true, generated: true },
            },
        })
        const ArticleSchema = new EntitySchema<{
            id: number
            tags: { id: number }[]
        }>({
            name: "article",
            columns: {
                id: { type: Number, primary: true, generated: true },
            },
            relations: {
                tags: {
                    type: "many-to-many",
                    target: "tag",
                    joinTable: {
                        name: "article_tags",
                        joinColumn: {
                            name: "article_id",
                            onDelete: "NO ACTION",
                            onUpdate: "NO ACTION",
                        },
                        inverseJoinColumn: {
                            name: "tag_id",
                            onDelete: "NO ACTION",
                            onUpdate: "NO ACTION",
                        },
                    },
                },
            },
        })

        let dataSources: DataSource[]

        before(async () => {
            dataSources = await createTestingConnections({
                entities: [ArticleSchema, TagSchema],
                disabledDrivers: ["spanner"],
            })
        })
        beforeEach(() => reloadTestingDatabases(dataSources))
        after(() => closeTestingConnections(dataSources))

        it("should pass join table column options through entity schemas", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const { owner, inverse } = junctionForeignKeys(
                        dataSource.getMetadata("article"),
                        "tags",
                    )

                    expect(owner.onDelete).to.equal("NO ACTION")
                    expect(owner.onUpdate).to.equal("NO ACTION")
                    expect(inverse.onDelete).to.equal("NO ACTION")
                    expect(inverse.onUpdate).to.equal("NO ACTION")
                }),
            ))
    })

    describe("driver validation", () => {
        let dataSources: DataSource[] = []

        after(() => closeTestingConnections(dataSources))

        it("should reject join column referential actions the driver does not support", async () => {
            let error: unknown
            try {
                dataSources = await createTestingConnections({
                    entities: [Article, Tag],
                    schemaCreate: false,
                    dropSchema: true,
                    enabledDrivers: ["oracle"],
                })
            } catch (e) {
                error = e
            }

            // only oracle restricts the supported referential actions,
            // so this only fails when an oracle connection is configured
            if (error)
                expect(error).to.eql(
                    new TypeORMError(
                        'OnDeleteType "RESTRICT" is not supported for oracle!',
                    ),
                )
        })
    })
})
