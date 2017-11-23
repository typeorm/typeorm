import "reflect-metadata";
import {expect} from "chai";
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases
} from "../../../../../utils/test-utils";
import {Connection} from "../../../../../../src/connection/Connection";
import {Category} from "./entity/Category";
import {Post} from "./entity/Post";

describe("query builder > relation-id > one-to-one > basic-functionality", () => {
    
    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should load ids when loadRelationIdAndMap used with OneToOne owner side relation", () => Promise.all(connections.map(async connection => {

        const category = new Category();
        category.name = "kids";
        await connection.manager.save(category);

        const post = new Post();
        post.title = "about kids";
        post.category = category;
        await connection.manager.save(post);

        const category2 = new Category();
        category2.name = "cars";
        await connection.manager.save(category2);

        const post2 = new Post();
        post2.title = "about cars";
        post2.category = category2;
        await connection.manager.save(post2);

        let loadedPosts = await connection.manager
            .createQueryBuilder(Post, "post")
            .loadRelationIdAndMap("post.categoryId", "post.category")
            .getMany();

        expect(loadedPosts![0].categoryId).to.not.be.empty;
        expect(loadedPosts![0].categoryId).to.be.equal(1);
        expect(loadedPosts![1].categoryId).to.not.be.empty;
        expect(loadedPosts![1].categoryId).to.be.equal(2);

        let loadedPost = await connection.manager
            .createQueryBuilder(Post, "post")
            .loadRelationIdAndMap("post.categoryId", "post.category")
            .where("post.id = :id", { id: post.id })
            .getOne();

        expect(loadedPost!.categoryId).to.not.be.empty;
        expect(loadedPost!.categoryId).to.be.equal(1);
    })));

    it("should load id when loadRelationIdAndMap used with OneToOne inverse side relation", () => Promise.all(connections.map(async connection => {

        const category = new Category();
        category.name = "kids";
        await connection.manager.save(category);

        const post = new Post();
        post.title = "about kids";
        post.category2 = category;
        await connection.manager.save(post);

        const category2 = new Category();
        category2.name = "cars";
        await connection.manager.save(category2);

        const post2 = new Post();
        post2.title = "about cars";
        post2.category2 = category2;
        await connection.manager.save(post2);

        let loadedCategories = await connection.manager
            .createQueryBuilder(Category, "category")
            .loadRelationIdAndMap("category.postId", "category.post")
            .getMany();

        expect(loadedCategories![0].postId).to.not.be.empty;
        expect(loadedCategories![0].postId).to.be.equal(1);
        expect(loadedCategories![1].postId).to.not.be.empty;
        expect(loadedCategories![1].postId).to.be.equal(2);

        let loadedCategory = await connection.manager
            .createQueryBuilder(Category, "category")
            .loadRelationIdAndMap("category.postId", "category.post")
            .getOne();

        expect(loadedCategory!.postId).to.not.be.empty;
        expect(loadedCategory!.postId).to.be.equal(1);
    })));

});