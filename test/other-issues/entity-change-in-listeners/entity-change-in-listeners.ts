import "reflect-metadata";
import {createTestingConnections, closeTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src/connection/Connection";
import {Post} from "./entity/Post";
import {expect} from "chai";

describe("other issues > entity change in listeners should affect persistence", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        schemaCreate: true,
        dropSchemaOnConnection: true,
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("if entity was changed in the listener, changed property should be updated in the db", () => Promise.all(connections.map(async function(connection) {

        // insert a post
        const post = new Post();
        post.title = "hello";
        await connection.entityManager.persist(post);

        // check if it was inserted correctly
        const loadedPost = await connection.entityManager.findOne(Post);
        expect(loadedPost).not.to.be.empty;
        loadedPost!.title.should.be.equal("hello");

        // now update some property and let update listener trigger
        loadedPost!.active = true;
        await connection.entityManager.persist(loadedPost!);

        // check if update listener was triggered and entity was really updated by the changes in the listener
        const loadedUpdatedPost = await connection.entityManager.findOne(Post);

        expect(loadedUpdatedPost).not.to.be.empty;
        loadedUpdatedPost!.title.should.be.equal("hello!");

        await connection.entityManager.persist(loadedPost!);
        await connection.entityManager.persist(loadedPost!);
        await connection.entityManager.persist(loadedPost!);
        await connection.entityManager.persist(loadedPost!);

    })));

});