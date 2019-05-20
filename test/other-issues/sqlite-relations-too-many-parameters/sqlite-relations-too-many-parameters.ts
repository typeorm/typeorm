import "reflect-metadata";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src/connection/Connection";
import {Category} from "./entity/Category";
import {Post} from "./entity/Post";

describe("other issues > sqlite relations too many parameters", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        enabledDrivers: ["sqlite"]
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should load 1200 relations without errors", () => Promise.all(connections.map(async function(connection) {

        // insert a post
        const post = new Post("hello post");
        post.categories = [];

        // insert few posts first
        const categories1: Category[] = [];
        for (let i = 1; i <= 400; i++) {
            categories1.push(new Category(String(i), "category #" + i));
        }
        await connection.manager.save(categories1);

        const categories2: Category[] = [];
        for (let i = 401; i <= 800; i++) {
            categories2.push(new Category(String(i), "category #" + i));
        }
        await connection.manager.save(categories2);

        const categories3: Category[] = [];
        for (let i = 801; i <= 1200; i++) {
            categories3.push(new Category(String(i), "category #" + i));
        }
        await connection.manager.save(categories3);

        post.categories = [...categories1];
        await connection.manager.save(post);

        post.categories = [...categories1, ...categories2];
        await connection.manager.save(post);

        post.categories = [...categories1, ...categories2, ...categories3];
        await connection.manager.save(post);

        const postWithCategory = await connection.manager.findOne(Post, 1, {
            relations: ["categories"]
        });

        postWithCategory!.categories.length.should.be.equal(1200);

    })));

});
