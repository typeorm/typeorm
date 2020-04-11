import "reflect-metadata";
import {expect} from "chai";
import {createTestingConnections, closeTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src/connection/Connection";
import {BaseEntity} from "../../../src/repository/BaseEntity";
import {Post} from "./entity/Post";

describe("github issues > #2500 .findOne(undefined) returns first item in the database instead of undefined", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        schemaCreate: true,
        dropSchema: true,
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    beforeEach(() => Promise.all(connections.map(async connection => {
        const post1 = new Post();
        post1.id = 1;
        post1.title = "How to buy a cat";
        post1.author = "John Doe";
        await connection.manager.save(post1);

        const post2 = new Post();
        post2.id = 2;
        post2.title = "How to buy a dog";
        post2.author = "Jane Doe";
        await connection.manager.save(post2);
    })));

    afterEach(() => Promise.all(connections.map(async connection => {
        await connection.manager.delete(Post, {});
    })));

    describe("EntityManager.findOne", () => {
        it("should find one record when no arguments given", () => Promise.all(connections.map(async connection => {
            const post = await connection.manager.findOne(Post);

            expect(post).not.to.be.undefined;
            expect(post!.id).to.be.a("number");
            expect(post!.title).to.be.a("string");
            expect(post!.author).to.be.a("string");
        })));

        it("should find one record for given criteria", () => Promise.all(connections.map(async connection => {
            const post1 = await connection.manager.findOne(Post, 1);
            expect(post1).not.to.be.undefined;
            expect(post1!.id).to.be.equal(1);
            expect(post1!.title).to.be.equal("How to buy a cat");
            expect(post1!.author).to.be.equal("John Doe");

            const post2 = await connection.manager.findOne(Post, { title: "How to buy a dog" });
            expect(post2).not.to.be.undefined;
            expect(post2!.id).to.be.equal(2);
            expect(post2!.title).to.be.equal("How to buy a dog");
            expect(post2!.author).to.be.equal("Jane Doe");

            const post3 = await connection.manager.findOne(Post, 1, { where: { title: "How to buy a cat" } });
            expect(post3).not.to.be.undefined;
            expect(post3!.id).to.be.equal(1);
            expect(post3!.title).to.be.equal("How to buy a cat");
            expect(post3!.author).to.be.equal("John Doe");
        })));

        it("should find no record for wrong criteria", () => Promise.all(connections.map(async connection => {
            expect(await connection.manager.findOne(Post, 10)).to.be.undefined;
            expect(await connection.manager.findOne(Post, { title: "How to buy a pig" })).to.be.undefined;
            expect(await connection.manager.findOne(Post, 1, { where: { title: "How to buy a dog" } })).to.be.undefined;
        })));

        it("should find no record for findOne(undefined)", () => Promise.all(connections.map(async connection => {
            expect(await connection.getRepository(Post).findOne(undefined)).to.be.undefined;
        })));

        it("should throw an error for findOne(null)", () => Promise.all(connections.map(async connection => {
            expect(await connection.getRepository(Post).findOne(null as any)).to.be.undefined;
        })));

        it("should throw an error for findOne(false)", () => Promise.all(connections.map(async connection => {
            expect(await connection.getRepository(Post).findOne(false as any)).to.be.undefined;
        })));
    });

    describe("Repository.findOne", () => {
        it("should find one record when no arguments given", () => Promise.all(connections.map(async connection => {
            const post = await connection.getRepository(Post).findOne();

            expect(post).not.to.be.undefined;
            expect(post!.id).to.be.a("number");
            expect(post!.title).to.be.a("string");
            expect(post!.author).to.be.a("string");
        })));

        it("should find one record for given criteria", () => Promise.all(connections.map(async connection => {
            const post1 = await connection.getRepository(Post).findOne(1);
            expect(post1).not.to.be.undefined;
            expect(post1!.id).to.be.equal(1);
            expect(post1!.title).to.be.equal("How to buy a cat");
            expect(post1!.author).to.be.equal("John Doe");

            const post2 = await connection.getRepository(Post).findOne({ title: "How to buy a dog" });
            expect(post2).not.to.be.undefined;
            expect(post2!.id).to.be.equal(2);
            expect(post2!.title).to.be.equal("How to buy a dog");
            expect(post2!.author).to.be.equal("Jane Doe");

            const post3 = await connection.getRepository(Post).findOne(1, { where: { title: "How to buy a cat" } });
            expect(post3).not.to.be.undefined;
            expect(post3!.id).to.be.equal(1);
            expect(post3!.title).to.be.equal("How to buy a cat");
            expect(post3!.author).to.be.equal("John Doe");
        })));

        it("should find no record for wrong criteria", () => Promise.all(connections.map(async connection => {
            expect(await connection.getRepository(Post).findOne(10)).to.be.undefined;
            expect(await connection.getRepository(Post).findOne({ title: "How to buy a pig" })).to.be.undefined;
            expect(await connection.getRepository(Post).findOne(1, { where: { title: "How to buy a dog" } })).to.be.undefined;
        })));

        it("should find no record for findOne(undefined)", () => Promise.all(connections.map(async connection => {
            expect(await connection.getRepository(Post).findOne(undefined)).to.be.undefined;
        })));

        it("should throw an error for findOne(null)", () => Promise.all(connections.map(async connection => {
            expect(await connection.getRepository(Post).findOne(null as any)).to.be.undefined;
        })));

        it("should throw an error for findOne(false)", () => Promise.all(connections.map(async connection => {
            expect(await connection.getRepository(Post).findOne(false as any)).to.be.undefined;
        })));
    });

    describe("BaseEntity.findOne", () => {
        it("should find one record when no arguments given", () => Promise.all(connections.map(async connection => {
            BaseEntity.useConnection(connection);
            const post = await Post.findOne();

            expect(post).not.to.be.undefined;
            expect(post!.id).to.be.a("number");
            expect(post!.title).to.be.a("string");
            expect(post!.author).to.be.a("string");
        })));

        it("should find one record for given criteria", () => Promise.all(connections.map(async connection => {
            BaseEntity.useConnection(connection);
            const post1 = await Post.findOne(1);
            expect(post1).not.to.be.undefined;
            expect(post1!.id).to.be.equal(1);
            expect(post1!.title).to.be.equal("How to buy a cat");
            expect(post1!.author).to.be.equal("John Doe");

            BaseEntity.useConnection(connection);
            const post2 = await Post.findOne({ title: "How to buy a dog" });
            expect(post2).not.to.be.undefined;
            expect(post2!.id).to.be.equal(2);
            expect(post2!.title).to.be.equal("How to buy a dog");
            expect(post2!.author).to.be.equal("Jane Doe");

            BaseEntity.useConnection(connection);
            const post3 = await Post.findOne(1, { where: { title: "How to buy a cat" } });
            expect(post3).not.to.be.undefined;
            expect(post3!.id).to.be.equal(1);
            expect(post3!.title).to.be.equal("How to buy a cat");
            expect(post3!.author).to.be.equal("John Doe");
        })));

        it("should find no record for wrong criteria", () => Promise.all(connections.map(async connection => {
            BaseEntity.useConnection(connection);
            expect(await Post.findOne(10)).to.be.undefined;

            BaseEntity.useConnection(connection);
            expect(await Post.findOne({ title: "How to buy a pig" })).to.be.undefined;

            BaseEntity.useConnection(connection);
            expect(await Post.findOne(1, { where: { title: "How to buy a dog" } })).to.be.undefined;
        })));

        it("should find no record for findOne(undefined)", () => Promise.all(connections.map(async connection => {
            BaseEntity.useConnection(connection);
            expect(await Post.findOne(undefined)).to.be.undefined;
        })));

        it("should throw an error for findOne(null)", () => Promise.all(connections.map(async connection => {
            BaseEntity.useConnection(connection);
            expect(await Post.findOne(null as any)).to.be.undefined;
        })));

        it("should throw an error for findOne(false)", () => Promise.all(connections.map(async connection => {
            BaseEntity.useConnection(connection);
            expect(await Post.findOne(false as any)).to.be.undefined;
        })));
    });
});
