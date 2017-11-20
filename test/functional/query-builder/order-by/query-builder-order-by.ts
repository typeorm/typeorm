import "reflect-metadata";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../../utils/test-utils";
import {Connection} from "../../../../src/connection/Connection";
import {expect} from "chai";
import {Post} from "./entity/Post";
import {PostgresDriver} from "../../../../src/driver/postgres/PostgresDriver";

describe("query builder > order-by", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should be always in right order(default order)", () => Promise.all(connections.map(async connection => {

        const post1 = new Post();
        post1.myOrder = 1;

        const post2 = new Post();
        post2.myOrder = 2;
        await connection.manager.save([post1, post2]);

        const loadedPost = await connection.manager
            .createQueryBuilder(Post, "post")
            .getOne();

        expect(loadedPost!.myOrder).to.be.equal(2);

    })));

    it("should be always in right order(custom order)", () => Promise.all(connections.map(async connection => {

        const post1 = new Post();
        post1.myOrder = 1;

        const post2 = new Post();
        post2.myOrder = 2;
        await connection.manager.save([post1, post2]);

        const loadedPost = await connection.manager
            .createQueryBuilder(Post, "post")
            .addOrderBy("post.myOrder", "ASC")
            .getOne();

        expect(loadedPost!.myOrder).to.be.equal(1);

    })));

    it("should be always in right order(custom order)", () => Promise.all(connections.map(async connection => {
        if (!(connection.driver instanceof PostgresDriver))
            return;

        const post1 = new Post();
        post1.myOrder = 1;

        const post2 = new Post();
        post2.myOrder = 2;
        await connection.manager.save([post1, post2]);

        const loadedPost1 = await connection.manager
            .createQueryBuilder(Post, "post")
            .addOrderBy("post.myOrder", "ASC", "NULLS FIRST")
            .getOne();

        expect(loadedPost1!.myOrder).to.be.equal(1);

        const loadedPost2 = await connection.manager
            .createQueryBuilder(Post, "post")
            .addOrderBy("post.myOrder", "ASC", "NULLS LAST")
            .getOne();

        expect(loadedPost2!.myOrder).to.be.equal(1);

    })));

});