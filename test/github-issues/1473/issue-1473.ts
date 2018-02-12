import "reflect-metadata";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src/connection/Connection";
import {Post} from "./entity/Post";
import {expect} from "chai";

async function createPosts(connection: Connection) {
    const promises: Promise<any>[] = [];
    for (let i = 1; i <= 5; i++) {
        const post1 = new Post();
        post1.id = i;
        post1.title = ([3, 4].indexOf(i) === -1) ? `post ${i}` : `custom ${i}`;
        post1.forum = ([2, 3].indexOf(i) === -1) ? "General" : "Custom";
        promises.push(connection.manager.save(post1));
    }
    return Promise.all(promises);
}

describe("github issues > #1473 FindOptions should be able to accept a custom where condition and other conditions", () => {

    let connections: Connection[];
    before(async () => {
        connections = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            schemaCreate: true,
            dropSchema: true,
        });
    });
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("using manager.findOne", () => Promise.all(connections.map(async connection => {
        await createPosts(connection);
        const post = await connection.manager.findOne(
            Post,
            {
                forum: "Custom"
            },
            {where: "title LIKE 'custom%'"}
        );
        expect(post).is.not.null;
        expect(post).is.instanceOf(Post);
        if (post) {
            expect(post.title).to.be.equal("custom 3");
        }
    })));

    it("using manager.find", () => Promise.all(connections.map(async connection => {
        await createPosts(connection);
        const posts = await connection.manager.find(
            Post,
            {
                forum: "Custom"
            },
            {where: "title LIKE 'custom%'"}
        );
        posts.length.should.be.equal(1);
        expect(posts[0]).is.instanceOf(Post);
        expect(posts[0].title).to.be.equal("custom 3");
    })));

    it("using manager.count", () => Promise.all(connections.map(async connection => {
        await createPosts(connection);
        const numPosts = await connection.manager.count(
            Post,
            {
                forum: "Custom"
            },
            {where: "title LIKE 'custom%'"}
        );
        numPosts.should.be.equal(1);
    })));

    it("using manager.findByIds", () => Promise.all(connections.map(async connection => {
        const createdPosts = await createPosts(connection);
        const posts = await connection.manager.findByIds(
            Post,
            createdPosts.map(post => post.id),
            {
                forum: "Custom"
            },
            {where: "title LIKE 'custom%'"}
        );
        posts.length.should.be.equal(1);
        expect(posts[0]).is.instanceOf(Post);
        expect(posts[0].title).to.be.equal("custom 3");
    })));

    it("using manager.findAndCount", () => Promise.all(connections.map(async connection => {
        await createPosts(connection);

        const [ posts, count ] = await connection.manager.findAndCount(
            Post,
            {
                forum: "Custom"
            },
            {where: "title LIKE 'custom%'"}
        );
        posts.length.should.be.equal(count);
        expect(posts[0]).is.instanceOf(Post);
        expect(posts[0].title).to.be.equal("custom 3");
    })));

});
