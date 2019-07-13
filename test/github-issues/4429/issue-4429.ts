import "reflect-metadata";
import {Connection} from "../../../src/connection/Connection";
import {closeTestingConnections, createTestingConnections} from "../../utils/test-utils";
import { Category } from "./entity/Category";
import { Post } from "./entity/Post";
import { expect } from "chai";
import { LessThan } from "../../../src/find-options/operator/LessThan";

describe("github issues > #4429 Incorrect construction of query with innerJoin and where ", () => {

    let connections: Connection[];
    before(async () => {
        connections = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            enabledDrivers: ["mysql"],
            schemaCreate: true,
            dropSchema: true,
        });
    });
    after(() => closeTestingConnections(connections));

    it("should correctly construct a query where named and unnamed parameters are mixed", () => Promise.all(connections.map(async connection => {
        const postRepository = connection.getRepository(Post);
        const categoryRepository = connection.getRepository(Category);
        
        const category = new Category();
        category.date = new Date(1970, 1, 1, 0, 0, 0);
        await categoryRepository.save(category);

        const post = new Post();
        post.name = "foo";
        post.categories = [ category ];
        await postRepository.save(post);

        const matches = await connection.getRepository(Category)
            .createQueryBuilder()
            .where({ date: LessThan(new Date()) })
            .innerJoin("Category.posts", "post", "post.name = :name", { name: "foo" })
            .getCount();
        expect(matches).to.be.equal(1);
    })));

});
