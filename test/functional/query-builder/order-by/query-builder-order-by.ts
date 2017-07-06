import "reflect-metadata";
import * as chai from "chai";
import {expect} from "chai";
import {createTestingConnections, closeTestingConnections, reloadTestingDatabases} from "../../../utils/test-utils";
import {Connection} from "../../../../src/connection/Connection";
import {Post} from "./entity/Post";

const should = chai.should();

describe.skip("query builder > order-by", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        schemaCreate: true,
        dropSchemaOnConnection: true,
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should be alway in right order(default order)", () => Promise.all(connections.map(async connection => {

        const post1 = new Post();
        post1.myOrder = 1;

        const post2 = new Post();
        post2.myOrder = 2;
        await connection.manager.save(post2);

        const loadedPost = await connection.manager
            .createQueryBuilder(Post, "post")
            .getOne();

        expect(loadedPost!.myOrder).to.be.equal(2);

    })));

    it("should be alway in right order(custom order)", () => Promise.all(connections.map(async connection => {

        const post1 = new Post();
        post1.myOrder = 1;

        const post2 = new Post();
        post2.myOrder = 2;
        await connection.manager.save(post2);

        const loadedPost = await connection.manager
            .createQueryBuilder(Post, "post")
            .addOrderBy("myOrderby", "ASC")
            .getOne();

        expect(loadedPost!.myOrder).to.be.equal(1);

    })));
});