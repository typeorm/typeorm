import "reflect-metadata";
import {Connection} from "../../../../src/connection/Connection";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../../utils/test-utils";
import {Post} from "./entity/Post";
import {Category} from "./entity/Category";
import {User} from "./entity/User";

describe("persistence > basic functionality", function() {

    let connections: Connection[];
    before(async () => {
        connections = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
        });
    });
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should save an entity", () => Promise.all(connections.map(async connection => {
        await connection.manager.save(new Post("Hello Post"));
    })));

    it("should remove an entity", () => Promise.all(connections.map(async connection => {
        const post = new Post("Hello Post");
        await connection.manager.save(post);
        await connection.manager.remove(post);
    })));

    it("should throw an error when not an object is passed to a save method", () => Promise.all(connections.map(async connection => {
        await connection.manager.save(undefined).should.be.rejectedWith(`Cannot save, given value must be an entity, instead "undefined" is given.`);
        await connection.manager.save(null).should.be.rejectedWith(`Cannot save, given value must be an entity, instead "null" is given.`);
        await connection.manager.save(123).should.be.rejectedWith(`Cannot save, given value must be an entity, instead "123" is given.`);
    })));

    it("should throw an error when not an object is passed to a remove method", () => Promise.all(connections.map(async connection => {
        await connection.manager.remove(undefined).should.be.rejectedWith(`Cannot remove, given value must be an entity, instead "undefined" is given.`);
        await connection.manager.remove(null).should.be.rejectedWith(`Cannot remove, given value must be an entity, instead "null" is given.`);
        await connection.manager.remove(123).should.be.rejectedWith(`Cannot remove, given value must be an entity, instead "123" is given.`);
    })));

    it("should throw an exception if object literal is given instead of constructed entity because it cannot determine what to save", () => Promise.all(connections.map(async connection => {
        await connection.manager.save({}).should.be.rejectedWith(`Cannot save, given value must be instance of entity class, instead object literal is given. Or you must specify an entity target to method call.`);
        await connection.manager.save([{}, {}]).should.be.rejectedWith(`Cannot save, given value must be instance of entity class, instead object literal is given. Or you must specify an entity target to method call.`);
        await connection.manager.save([new Post("Hello Post"), {}]).should.be.rejectedWith(`Cannot save, given value must be instance of entity class, instead object literal is given. Or you must specify an entity target to method call.`);
        await connection.manager.remove({}).should.be.rejectedWith(`Cannot remove, given value must be instance of entity class, instead object literal is given. Or you must specify an entity target to method call.`);
        await connection.manager.remove([{}, {}]).should.be.rejectedWith(`Cannot remove, given value must be instance of entity class, instead object literal is given. Or you must specify an entity target to method call.`);
        await connection.manager.remove([new Post("Hello Post"), {}]).should.be.rejectedWith(`Cannot remove, given value must be instance of entity class, instead object literal is given. Or you must specify an entity target to method call.`);
    })));

    it("should be able to save and remove entities of different types", () => Promise.all(connections.map(async connection => {
        const post = new Post("Hello Post");
        const category = new Category("Hello Category");
        const user = new User("Hello User");

        await connection.manager.save([post, category, user]);
        await connection.manager.findOne(Post, 1).should.eventually.eql({ id: 1, title: "Hello Post" });
        await connection.manager.findOne(Category, 1).should.eventually.eql({ id: 1, name: "Hello Category" });
        await connection.manager.findOne(User, 1).should.eventually.eql({ id: 1, name: "Hello User" });

        await connection.manager.remove([post, category, user]);
        await connection.manager.findOne(Post, 1).should.eventually.be.undefined;
        await connection.manager.findOne(Category, 1).should.eventually.be.undefined;
        await connection.manager.findOne(User, 1).should.eventually.be.undefined;
    })));

});
