import "reflect-metadata";
import { Connection } from "../../../src/connection/Connection";
import { closeTestingConnections, createTestingConnections, reloadTestingDatabases } from "../../utils/test-utils";
import { Post } from "./entity/Post";

describe("github issues > #5501 Incorrect data loading from JSON string for column type 'simple-json'", () => {

    let connections: Connection[];
    before(async () => {
        connections = await createTestingConnections({
            entities: [Post],
            schemaCreate: true,
            dropSchema: true
        });
    });
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should correctly add/retrieve simple-json field with a string value", () =>
    Promise.all(connections.map(async (connection) => {
        const repo = connection.getRepository(Post);
        const post = new Post();
        post.id = 1;
        post.jsonField = "";
        await repo.save(post);
        const postFound = await repo.findOne(1);
        postFound!.id.should.eql(1);
        postFound!.jsonField.should.eql("");
    })));

    it("should correctly add/retrieve simple-json field with some object value", () =>
    Promise.all(connections.map(async (connection) => {
        const repo = connection.getRepository(Post);
        const post = new Post();
        post.id = 1;
        post.jsonField = {"key": "value"};
        await repo.save(post);
        const postFound = await repo.findOne(1);
        postFound!.id.should.eql(1);
        postFound!.jsonField.should.eql({"key": "value"});
    })));

    it("should correctly add/retrieve simple-json field with an array value", () =>
    Promise.all(connections.map(async (connection) => {
        const repo = connection.getRepository(Post);
        const post = new Post();
        post.id = 1;
        post.jsonField = [{"key": "value"}];
        await repo.save(post);
        const postFound = await repo.findOne(1);
        postFound!.id.should.eql(1);
        postFound!.jsonField.should.eql([{"key": "value"}]);
    })));

    it("should correctly add/retrieve simple-json field with null value", () =>
    Promise.all(connections.map(async (connection) => {
        const repo = connection.getRepository(Post);
        const post = new Post();
        post.id = 1;
        post.jsonField = null;
        await repo.save(post);
        const postFound = await repo.findOne(1);
        postFound!.id.should.eql(1);
        postFound!.jsonField.should.eql(null);
    })));

});
