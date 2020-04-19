import "reflect-metadata";
import {expect} from "chai";
import {createTestingConnections, closeTestingConnections, reloadTestingDatabases, TestingOptions} from "../../utils/test-utils";
import {Connection} from "../../../src/connection/Connection";
import {BaseEntity} from "../../../src/repository/BaseEntity";
import {SqlPost} from "./entity/Post.sql";
import {MongoPost} from "./entity/Post.mongo";

const testParams: {dbType: string, connectionsParams: TestingOptions, PostConstructor: typeof SqlPost | typeof MongoPost}[] = [
    {
        dbType: "sql",
        connectionsParams: {
            entities: [__dirname + "/entity/*.sql{.js,.ts}"],
            schemaCreate: true,
            dropSchema: true,
        },
        PostConstructor: SqlPost
    },
    {
        dbType: "mongo",
        connectionsParams: {
            entities: [__dirname + "/entity/*.mongo{.js,.ts}"],
            enabledDrivers: ["mongodb"],
            schemaCreate: true,
            dropSchema: true,
        },
        PostConstructor: MongoPost
    }
];

describe("github issues > #2500 .findOne(undefined) returns first item in the database instead of undefined", () => {
    testParams.forEach(({dbType, connectionsParams, PostConstructor}) => describe(dbType, () => {
        let connections: Connection[];
        before(async () => connections = await createTestingConnections(connectionsParams));
        beforeEach(() => reloadTestingDatabases(connections));
        after(() => closeTestingConnections(connections));

        const Post = PostConstructor;
        let firstPost: SqlPost | MongoPost;
        let secondPost: SqlPost | MongoPost;

        beforeEach(() => Promise.all(connections.map(async connection => {
            firstPost = new Post();
            firstPost.title = "How to buy a cat";
            firstPost.author = "John Doe";
            await connection.manager.save(firstPost);

            secondPost = new Post();
            secondPost.title = "How to buy a dog";
            secondPost.author = "Jane Doe";
            await connection.manager.save(secondPost);
        })));

        describe("EntityManager.findOne", () => {
            it("should find one record when no arguments given", () => Promise.all(connections.map(async connection => {
                const post = await connection.manager.findOne(Post);

                expect(post).not.to.be.undefined;
                expect(post!.id).not.to.be.undefined;
                expect(post!.title).to.be.a("string");
                expect(post!.author).to.be.a("string");
            })));

            it("should find one record for given criteria", () => Promise.all(connections.map(async connection => {
                const post1 = await connection.manager.findOne(Post, firstPost.id);
                expect(post1).not.to.be.undefined;
                expect(post1!.id).to.be.eql(firstPost.id);
                expect(post1!.title).to.be.equal("How to buy a cat");
                expect(post1!.author).to.be.equal("John Doe");

                const post2 = await connection.manager.findOne(Post, { title: "How to buy a dog" });
                expect(post2).not.to.be.undefined;
                expect(post2!.id).to.be.eql(secondPost.id);
                expect(post2!.title).to.be.equal("How to buy a dog");
                expect(post2!.author).to.be.equal("Jane Doe");

                const post3 = await connection.manager.findOne(Post, firstPost.id, { where: { title: "How to buy a cat" } });
                expect(post3).not.to.be.undefined;
                expect(post3!.id).to.be.eql(firstPost.id);
                expect(post3!.title).to.be.equal("How to buy a cat");
                expect(post3!.author).to.be.equal("John Doe");
            })));

            it("should find no record for wrong criteria", () => Promise.all(connections.map(async connection => {
                expect(await connection.manager.findOne(Post, { title: "How to buy a pig" })).to.be.undefined;
                expect(await connection.manager.findOne(Post, firstPost.id, { where: { title: "How to buy a dog" } })).to.be.undefined;
            })));

            it("should find no record for findOne(undefined)", () => Promise.all(connections.map(async connection => {
                expect(await connection.manager.findOne(Post, undefined)).to.be.undefined;
            })));

            it("should throw an error for findOne(null)", () => Promise.all(connections.map(async connection => {
                expect(await connection.manager.findOne(Post, null as any)).to.be.undefined;
            })));

            it("should throw an error for findOne(false)", () => Promise.all(connections.map(async connection => {
                expect(await connection.manager.findOne(Post, false as any)).to.be.undefined;
            })));
        });

        describe("Repository.findOne", () => {
            it("should find one record when no arguments given", () => Promise.all(connections.map(async connection => {
                const post = await connection.getRepository(Post).findOne();

                expect(post).not.to.be.undefined;
                expect(post!.id).not.to.be.undefined;
                expect(post!.title).to.be.a("string");
                expect(post!.author).to.be.a("string");
            })));

            it("should find one record for given criteria", () => Promise.all(connections.map(async connection => {
                const post1 = await connection.getRepository(Post).findOne(firstPost.id);
                expect(post1).not.to.be.undefined;
                expect(post1!.id).to.be.eql(firstPost.id);
                expect(post1!.title).to.be.equal("How to buy a cat");
                expect(post1!.author).to.be.equal("John Doe");

                const post2 = await connection.getRepository(Post).findOne({ title: "How to buy a dog" });
                expect(post2).not.to.be.undefined;
                expect(post2!.id).to.be.eql(secondPost.id);
                expect(post2!.title).to.be.equal("How to buy a dog");
                expect(post2!.author).to.be.equal("Jane Doe");

                const post3 = await connection.getRepository(Post).findOne(firstPost.id, { where: { title: "How to buy a cat" } });
                expect(post3).not.to.be.undefined;
                expect(post3!.id).to.be.eql(firstPost.id);
                expect(post3!.title).to.be.equal("How to buy a cat");
                expect(post3!.author).to.be.equal("John Doe");
            })));

            it("should find no record for wrong criteria", () => Promise.all(connections.map(async connection => {
                expect(await connection.getRepository(Post).findOne({ title: "How to buy a pig" })).to.be.undefined;
                expect(await connection.getRepository(Post).findOne(firstPost.id, { where: { title: "How to buy a dog" } })).to.be.undefined;
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
                expect(post!.id).not.to.be.undefined;
                expect(post!.title).to.be.a("string");
                expect(post!.author).to.be.a("string");
            })));

            it("should find one record for given criteria", () => Promise.all(connections.map(async connection => {
                BaseEntity.useConnection(connection);
                const post1 = await Post.findOne(firstPost.id);
                expect(post1).not.to.be.undefined;
                expect(post1!.id).to.be.eql(firstPost.id);
                expect(post1!.title).to.be.equal("How to buy a cat");
                expect(post1!.author).to.be.equal("John Doe");

                BaseEntity.useConnection(connection);
                const post2 = await Post.findOne({ title: "How to buy a dog" });
                expect(post2).not.to.be.undefined;
                expect(post2!.id).to.be.eql(secondPost.id);
                expect(post2!.title).to.be.equal("How to buy a dog");
                expect(post2!.author).to.be.equal("Jane Doe");

                BaseEntity.useConnection(connection);
                const post3 = await Post.findOne(firstPost.id, { where: { title: "How to buy a cat" } });
                expect(post3).not.to.be.undefined;
                expect(post3!.id).to.be.eql(firstPost.id);
                expect(post3!.title).to.be.equal("How to buy a cat");
                expect(post3!.author).to.be.equal("John Doe");
            })));

            it("should find no record for wrong criteria", () => Promise.all(connections.map(async connection => {
                BaseEntity.useConnection(connection);
                expect(await Post.findOne({ title: "How to buy a pig" })).to.be.undefined;

                BaseEntity.useConnection(connection);
                expect(await Post.findOne(firstPost.id, { where: { title: "How to buy a dog" } })).to.be.undefined;
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
    }));
});
