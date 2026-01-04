import "reflect-metadata"
import { expect } from "chai"
import { DataSource } from "../../../src"
import { Post } from "./entity/Post"
import {
    createTestingConnections,
    reloadTestingDatabases,
    closeTestingConnections,
} from "../../utils/test-utils"

describe("github issues > #7100 MSSQL error when user requests additional columns to be returned", () => {
    let connections: DataSource[]

    before(async () => {
        connections = await createTestingConnections({
            entities: [Post],
            schemaCreate: true,
            dropSchema: true,
            enabledDrivers: ["mssql"],
        })
    })
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should return user requested columns", () =>
        Promise.all(
            connections.map(async (connection) => {
                const post = new Post()
                post.title = "title"
                post.text = "text"

                await connection
                    .createQueryBuilder()
                    .insert()
                    .into(Post)
                    .values(post)
                    .returning(["text"])
                    .execute()

                // Locally we have forgotten what text was set to, must re-fetch
                post.text = ""
                await connection
                    .createQueryBuilder(Post, "post")
                    .update()
                    .set({ title: "TITLE" })
                    .returning(["title", "text"])
                    .whereEntity(post)
                    .updateEntity(true)
                    .execute()

                expect(post.title).to.be.equal("TITLE")
                expect(post.text).to.be.equal("text")
            }),
        ))
})
