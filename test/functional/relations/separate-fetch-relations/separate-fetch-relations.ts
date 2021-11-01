import "reflect-metadata";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../../utils/test-utils";
import {Connection} from "../../../../src";
import {Post} from "./entity/Post";
import {Category} from "./entity/Category";
import { Author } from "./entity/Author";

describe("relations > separate-fetch-relations", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    describe("Separate fetch relation provided in finding options", function() {

        it("should work with join relations perfectly", () => Promise.all(connections.map(async connection => {

            const category1 = new Category();
            category1.name = "Category #1";
            await connection.manager.save(category1);

            const author1 = new Author();
            author1.name = "Hello author";
            await connection.manager.save(author1);

            const post1 = new Post();
            post1.title = "Hello Post #1";
            post1.category = category1;
            post1.author = author1;

            await connection.manager.save(post1);

            const category2 = new Category();
            category2.name = "Category #2";
            await connection.manager.save(category2);

            const post2 = new Post();
            post2.title = "Hello Post #2";
            post2.category = category2;
            post2.author = author1;

            await connection.manager.save(post2);

            // Should work with join relations
            const posts = await connection.manager.find(Post, {
                relations: ["category"],
                where: {category:{name: "Category #2"}},
                separateFetchRelations: ["author","author.post"]
            });

            posts.should.be.eql([{
                title: "Hello Post #2",
                category: {
                    id: 2,
                    name: "Category #2"
                },
                author: {
                    id: 1,
                    name: "Hello author",
                    post: [
                        {
                            title: "Hello Post #1"
                        },
                        {
                            title: "Hello Post #2"
                        }
                    ]

                }
            }]);
        })));

    });

});
