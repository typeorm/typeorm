import "reflect-metadata";
import { createTestingConnections, closeTestingConnections, reloadTestingDatabases } from "../../utils/test-utils";
import { Connection } from "../../../src/connection/Connection";
import { expect } from "chai";
import { Post } from "./entity/Post";

describe("github issues > #7146 Lazy relations resolve to 'undefined' instead of 'null'", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        schemaCreate: true,
        dropSchema: true,
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    async function prepareData(connection: Connection) {
        const savedPost = new Post();
        await connection.manager.save(savedPost);
    }

    // The following 3 tests hilight the reported issue.
    // The remaining 6 tests were already succeeding before, but are included for completeness sake.

    describe("lazy-loaded relations", () => {

        it("should return null if ManyToOne relation has NULL in database", () => Promise.all(connections.map(async connection => {
            await prepareData(connection);
            const post = (await connection.manager.findOneOrFail(Post, 1));
            expect(await post.lazyManyToOne).to.be.null;
        })));

        it("should return null if OneToOne+JoinColumn relation has NULL in database", () => Promise.all(connections.map(async connection => {
            await prepareData(connection);
            const post = (await connection.manager.findOneOrFail(Post, 1));
            expect(await post.lazyOneToOneOwner).to.be.null;
        })));

        it("should return null if OneToOne relation has NULL in database", () => Promise.all(connections.map(async connection => {
            await prepareData(connection);
            const post = (await connection.manager.findOneOrFail(Post, 1));
            expect(await post.lazyOneToOne).to.be.null;
        })));

    });

    describe("lazy-loaded relations included in 'relations' find option", () => {

        it("should return null if ManyToOne relation has NULL in database", () => Promise.all(connections.map(async connection => {
            await prepareData(connection);
            const post = (await connection.manager.findOneOrFail(Post, 1, { relations: ['lazyManyToOne'] }));
            expect(await post.lazyManyToOne).to.be.null;
        })));

        it("should return null if OneToOne+JoinColumn relation has NULL in database", () => Promise.all(connections.map(async connection => {
            await prepareData(connection);
            const post = (await connection.manager.findOneOrFail(Post, 1, { relations: ['lazyOneToOneOwner'] }));
            expect(await post.lazyOneToOneOwner).to.be.null;
        })));

        it("should return null if OneToOne relation has NULL in database", () => Promise.all(connections.map(async connection => {
            await prepareData(connection);
            const post = (await connection.manager.findOneOrFail(Post, 1, { relations: ['lazyOneToOne'] }));
            expect(await post.lazyOneToOne).to.be.null;
        })));

    });

    describe("eager-loaded relations", () => {

        it("should return null if ManyToOne relation has NULL in database", () => Promise.all(connections.map(async connection => {
            await prepareData(connection);
            const post = (await connection.manager.findOneOrFail(Post, 1));
            expect(post.eagerManyToOne).to.be.null;
        })));

        it("should return null if OneToOne+JoinColumn relation has NULL in database", () => Promise.all(connections.map(async connection => {
            await prepareData(connection);
            const post = (await connection.manager.findOneOrFail(Post, 1));
            expect(post.eagerOneToOneOwner).to.be.null;
        })));

        it("should return null if OneToOne relation has NULL in database", () => Promise.all(connections.map(async connection => {
            await prepareData(connection);
            const post = (await connection.manager.findOneOrFail(Post, 1));
            expect(post.eagerOneToOne).to.be.null;
        })));

    });

});
