import "reflect-metadata";
import {createTestingConnections, closeTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src/connection/Connection";
import {Post} from "./entity/Post";
import {Category} from "./entity/Category";
import {expect} from "chai";

describe.only("github issues > Join query on ManyToMany relations not working", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        schemaCreate: true,
        dropSchemaOnConnection: true,
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("embedded with custom column name should persist and load without errors", () => Promise.all(connections.map(async connection => {

        for (let i = 0; i < 20; i++) {
            const category = new Category();
            category.name = "Category #" + i;
            await connection.entityManager.persist(category);
        }

        const post = new Post();
        post.title = "SuperRace";
        post.categories = [new Category()];
        post.categories[0].name = "SuperCategory";
        await connection.entityManager.persist(post);

        const loadedPost = await connection
            .entityManager
            .createQueryBuilder(Post, "post")
            .leftJoinAndSelect("post.categories", "category")
            .where("category.category_id IN (:ids)", { ids: [21] })
            .getOne();

        console.log(loadedPost);

        expect(loadedPost).not.to.be.empty;

    })));

});
