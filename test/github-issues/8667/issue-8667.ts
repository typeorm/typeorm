import "reflect-metadata"
import { expect } from "chai"
import { DataSource } from "../../../src"
import { Post } from "./entity/Post"
import {
    createTestingConnections,
    reloadTestingDatabases,
    closeTestingConnections,
} from "../../utils/test-utils"

describe("github issues > #8667 Support RETURNING clause in SQLite", () => {
    let connections: DataSource[]
    let post: Post

    before(async () => {
        connections = await createTestingConnections({
            entities: [Post],
            schemaCreate: true,
            dropSchema: true,
            enabledDrivers: ["sqlite", "better-sqlite3", "sqljs"],
        })

        post = new Post()
        post.title = "title"
        post.text = "text"
    })

    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should return all columns via QueryRunner", async () =>
        Promise.all(
            connections.map(async (connection) => {
                await connection
                    .createQueryBuilder()
                    .insert()
                    .into(Post)
                    .values(post)
                    .execute()

                const queryRunner = connection.createQueryRunner()

                const { tableName } = connection.getMetadata(Post)

                await queryRunner.connect()

                const res = await queryRunner.query(
                    `UPDATE ${tableName} SET title = 'updated title value' RETURNING *`,
                )

                expect(res).to.be.deep.equal([
                    { id: 1, title: "updated title value", text: "text" },
                ])
            }),
        ))

    it("should return user requested columns via QueryBuilder", () =>
        Promise.all(
            connections.map(async (connection) => {
                const returning = (
                    await connection
                        .createQueryBuilder()
                        .insert()
                        .into(Post)
                        .values(post)
                        .returning(["text"])
                        .execute()
                ).raw

                expect(returning[0].text).to.be.equal("text")

                const deleted = (
                    await connection
                        .createQueryBuilder(Post, "post")
                        .delete()
                        .where(post)
                        .returning(["title", "text"])
                        .execute()
                ).raw

                expect(deleted[0].title).to.be.equal("title")
                expect(deleted[0].text).to.be.equal("text")
            }),
        ))
})
