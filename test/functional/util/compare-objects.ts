import "reflect-metadata";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src/connection/Connection";
import {Post} from "./entity/Post";
import {Counters} from "./entity/Counters";

describe("util > compare2Objects functionality", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [Post, Counters],
        enabledDrivers: ["mysql"]
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should compare two binary objects correctly", () => Promise.all(connections.map(async connection => {

        // create and save a post and a counters first
        const post = new Post();
        post.id = new Buffer([0]);
        await connection.manager.save(post);
        const counters = new Counters();
        counters.id = new Buffer([0]);
        await connection.manager.save(counters);

        // then update its properties and save again
        const loadedPost = await connection.getRepository(Post).findOne();
        loadedPost!.counters = counters!;
        await connection.manager.save(loadedPost!);

    })));

    it("should compare binary and null objects correctly", () => Promise.all(connections.map(async connection => {

        // create and save a post and a counters first
        const counters = new Counters();
        counters.id = new Buffer([0]);
        await connection.manager.save(counters);
        const post = new Post();
        post.id = new Buffer([0]);
        post.counters = counters;
        await connection.manager.save(post);

        // then update its properties and save again
        const loadedPost = await connection.getRepository(Post).findOne();
        loadedPost!.counters = null!;
        await connection.manager.save(loadedPost!);

    })));
});