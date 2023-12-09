import "../../../utils/test-setup"
import { Post } from "./entity/Post"
import { DataSource, ILike } from "../../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { JSONOperator } from "../../../../src/find-options/operator/JSONOperator"
import { Author } from "./entity/Author"

describe("json > json-operator", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [Post, Author],
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
        ));
        
    it("should find the entities matching the json operator with one to one relations", () =>
        Promise.all(
            connections.map(async (connection) => {
                const author1 = new Author()
                author1.id = 1;
                author1.name = { fr: 'lejeune', en: 'theyoung' }

                const author2 = new Author()
                author2.id = 2;
                author2.name = { fr: 'levieux', en: 'theold' }

                await connection.manager.save([author1, author2])

                const post1 = new Post()
                post1.id = 1;
                post1.title = "Post #1"
                post1.category = { fr: "Livres" , en: "Books" }
                post1.author = author1;

                const post2 = new Post()
                post2.id = 2;
                post2.title = "Post #2"
                post2.category = { fr: "Armoires", en : "Shelves" }
                await connection.manager.save([post1, post2])

                const loadedPost1 = await connection.manager.findBy(Post, {
                    author:{ name: JSONOperator("fr", ILike('%jeune%')),}
                })
                loadedPost1.should.be.eql([
                    {
                        id: 1,
                        title: "Post #1",
                        category: { fr: "Livres" , en: "Books" }
                    },
                ]);
            }),
        ));
    })
