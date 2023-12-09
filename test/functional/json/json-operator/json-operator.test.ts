import "../../../utils/test-setup"
import { Post } from "./entity/Post"
import { DataSource, ILike } from "../../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { JSONOperator } from "../../../../src/find-options/operator/JSONOperator"

describe("json > json-operator", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [Post],
                enabledDrivers: ["postgres"], // because only postgres supports jsonb type
                // logging: true,
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should find the entities matching the json operator", () =>
        Promise.all(
            connections.map(async (connection) => {
                const post1 = new Post()
                post1.title = "Post #1"
                post1.category = { fr: "Livres" , en: "Books" }

                const post2 = new Post()
                post2.title = "Post #2"
                post2.category = { fr: "Armoires", en : "Shelves" }
                await connection.manager.save([post1, post2])

                const loadedPost1 = await connection.manager.findBy(Post, {
                    category: JSONOperator("en", ILike('books')),
                })
                loadedPost1.should.be.eql([
                    {
                        id: 1,
                        title: "Post #1",
                        category: { fr: "Livres" , en: "Books" }
                    },
                ]);
            }),
        ))
})
