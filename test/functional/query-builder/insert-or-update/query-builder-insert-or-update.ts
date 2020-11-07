import "reflect-metadata";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../../utils/test-utils";
import {Connection} from "../../../../src/connection/Connection";
import {Post} from "./entity/Post";

describe("query builder > insertion > or update", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        enabledDrivers: ["mysql", "postgres", "sqlite", "better-sqlite3"] // only supported in mysql, postgres and sqlite >= 3.24.0
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should perform insertion or update correctly", () => Promise.all(connections.map(async connection => {

        const post1 = new Post();
        post1.id = "post#1";
        post1.title = "About post";

        await connection.createQueryBuilder()
            .insert()
            .into(Post)
            .values(post1)
            .execute();

        const post2 = new Post();
        post2.id = "post#1";
        post2.title = "Again post";

        await connection.createQueryBuilder()
            .insert()
            .into(Post)
            .values(post2)
            .orUpdate(["title"])
            .execute();

        await connection.manager.findOne(Post, "post#1").should.eventually.be.eql({
            id: "post#1",
            title: "Again post"
        });

        const post3 = new Post();
        post3.id = "post#1";
        post3.title = "Yet again post";

        await connection.createQueryBuilder()
            .insert()
            .into(Post)
            .values(post3)
            .orUpdate(false, {
                title: post3.title
            })
            .execute();

        await connection.manager.findOne(Post, "post#1").should.eventually.be.eql({
            id: "post#1",
            title: "Yet again post"
        });

        const post4 = new Post();
        post4.id = "post#1";
        post4.title = "And yet again post";

        await connection.createQueryBuilder()
            .insert()
            .into(Post)
            .values(post4)
            .orUpdate(true)
            .execute();

        await connection.manager.findOne(Post, "post#1").should.eventually.be.eql({
            id: "post#1",
            title: "And yet again post"
        });
    })));

});
