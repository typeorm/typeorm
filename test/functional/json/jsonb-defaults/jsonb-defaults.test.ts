import { DataSource } from "../../../../src"
import "../../../utils/test-setup"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { Post } from "./entity/Post"

describe("json > defaults", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [Post],
                enabledDrivers: [
                    "postgres",
                    "sqlite",
                    "better-sqlite3",
                    "sqljs",
                ],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should insert default values properly", () =>
        Promise.all(
            connections.map(async (connection) => {
                const post1 = new Post()
                post1.title = "Post #1"
                await connection.manager.save(post1)

                const loadedPost1 = await connection.manager.findBy(Post, {
                    title: "Post #1",
                })
                loadedPost1.should.be.eql([
                    {
                        id: 1,
                        title: "Post #1",
                        authors: ["Dmitry", "Olimjon"],
                        category: { name: "TypeScript" },
                        categories: [{ name: "TypeScript" }],
                    },
                ])

                const post2 = new Post()
                post2.title = "Post #2"
                post2.authors = [`Umed`, `Dmitry`]
                post2.category = { name: "JavaScript" }
                post2.categories = [
                    { name: "JavaScript" },
                    { name: "ECMAScript" },
                ]
                await connection.manager.save(post2)

                const loadedPost2 = await connection.manager.findBy(Post, {
                    title: "Post #2",
                })
                loadedPost2.should.be.eql([
                    {
                        id: 2,
                        title: "Post #2",
                        authors: ["Umed", "Dmitry"],
                        category: { name: "JavaScript" },
                        categories: [
                            { name: "JavaScript" },
                            { name: "ECMAScript" },
                        ],
                    },
                ])
            }),
        ))
})
