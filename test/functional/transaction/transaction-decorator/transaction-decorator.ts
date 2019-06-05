import "reflect-metadata";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../../utils/test-utils";
import {Connection} from "../../../../src/connection/Connection";
import {Post} from "./entity/Post";
import {expect} from "chai";
import {PostController} from "./controller/PostController";
import {Category} from "./entity/Category";

describe("transaction > method wrapped into transaction decorator", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        enabledDrivers: ["mysql"] // since @Transaction accepts a specific connection name we can use only one connection and its name
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    // create a fake controller
    const controller = new PostController();

    it("should execute all operations in the method in a transaction", () => Promise.all(connections.map(async connection => {

        const post = new Post();
        post.title = "successfully saved post";

        const category = new Category();
        category.name = "successfully saved category";

        // call controller method
        await controller.save.apply(controller, [post, category]);

        // controller should have saved both post and category successfully
        const loadedPost = await connection.manager.findOne(Post, { where: { title: "successfully saved post" } });
        expect(loadedPost).not.to.be.undefined;
        loadedPost!.should.be.eql(post);

        const loadedCategory = await connection.manager.findOne(Category, { where: { name: "successfully saved category" } });
        expect(loadedCategory).not.to.be.undefined;
        loadedCategory!.should.be.eql(category);

    })));

    it("should rollback transaction if any operation in the method failed", () => Promise.all(connections.map(async connection => {

        const post = new Post();
        post.title = "successfully saved post";

        const category = new Category(); // this will fail because no name set

        // call controller method and make its rejected since controller action should fail
        let throwError: any;
        try {
            await controller.save.apply(controller, [post, category]);
        } catch (err) {
            throwError = err;
        }
        expect(throwError).not.to.be.undefined;

        const loadedPost = await connection.manager.findOne(Post, { where: { title: "successfully saved post" }});
        expect(loadedPost).to.be.undefined;

        const loadedCategory = await connection.manager.findOne(Category, { where: { name: "successfully saved category" }});
        expect(loadedCategory).to.be.undefined;

    })));

    it("should rollback transaction if any operation in the method failed", () => Promise.all(connections.map(async connection => {

        const post = new Post();  // this will fail because no title set

        const category = new Category();
        category.name = "successfully saved category";

        // call controller method and make its rejected since controller action should fail
        let throwError: any;
        try {
            await controller.save.apply(controller, [post, category]);
        } catch (err) {
            throwError = err;
        }
        expect(throwError).not.to.be.undefined;

        const loadedPost = await connection.manager.findOne(Post, { where: { title: "successfully saved post" }});
        expect(loadedPost).to.be.undefined;

        const loadedCategory = await connection.manager.findOne(Category, { where: { name: "successfully saved category" }});
        expect(loadedCategory).to.be.undefined;

    })));

    it("should save even if second operation failed in method not wrapped into @Transaction decorator", () => Promise.all(connections.map(async connection => {

        const post = new Post(); // this will be saved in any cases because its valid
        post.title = "successfully saved post";

        const category = new Category(); // this will fail because no name set

        // call controller method and make its rejected since controller action should fail
        let throwError: any;
        try {
            await controller.nonSafeSave.apply(controller, [connection.manager, post, category]);

        } catch (err) {
            throwError = err;
        }
        expect(throwError).not.to.be.undefined;

        // controller should have saved both post and category successfully
        const loadedPost = await connection.manager.findOne(Post, { where: { title: "successfully saved post" }});
        expect(loadedPost).not.to.be.undefined;
        loadedPost!.should.be.eql(post);

        const loadedCategory = await connection.manager.findOne(Category, { where: { name: "successfully saved category" }});
        expect(loadedCategory).to.be.undefined;

    })));

    it("should inject repository and custom repository into method decorated with @Transaction", () => Promise.all(connections.map(async connection => {
        const post = new Post();
        post.title = "successfully saved post";

        const category = new Category();
        category.name = "successfully saved category";

        // call controller method
        const savedCategory = await controller.saveWithRepository.apply(controller, [post, category]);
        
        // controller should successfully call custom repository method and return the found entity
        expect(savedCategory).not.to.be.undefined;
        savedCategory!.should.be.eql(category);

        // controller should have saved both post and category successfully
        const loadedPost = await connection.manager.findOne(Post, { where: { title: "successfully saved post" } });
        expect(loadedPost).not.to.be.undefined;
        loadedPost!.should.be.eql(post);

        const loadedCategory = await connection.manager.findOne(Category, { where: { name: "successfully saved category" } });
        expect(loadedCategory).not.to.be.undefined;
        loadedCategory!.should.be.eql(category);
    })));

    it("should execute all operations in the method in a transaction with a specified isolation", () => Promise.all(connections.map(async connection => {

        const post = new Post();
        post.title = "successfully saved post";

        const category = new Category();
        category.name = "successfully saved category";

        // call controller method
        await controller.saveWithNonDefaultIsolation.apply(controller, [post, category]);

        // controller should have saved both post and category successfully
        const loadedPost = await connection.manager.findOne(Post, { where: { title: "successfully saved post" } });
        expect(loadedPost).not.to.be.undefined;
        loadedPost!.should.be.eql(post);

        const loadedCategory = await connection.manager.findOne(Category, { where: { name: "successfully saved category" } });
        expect(loadedCategory).not.to.be.undefined;
        loadedCategory!.should.be.eql(category);

    })));

});
