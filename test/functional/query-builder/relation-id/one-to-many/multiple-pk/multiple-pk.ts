import "reflect-metadata";
import {expect} from "chai";
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases
} from "../../../../../utils/test-utils";
import {Connection} from "../../../../../../src/connection/Connection";
import {Post} from "./entity/Post";
import {Category} from "./entity/Category";
import {Image} from "./entity/Image";

describe("query builder > relation-id > one-to-many > multiple-pk", () => {
    
    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should load ids when both entities have multiple primary keys", () => Promise.all(connections.map(async connection => {

        const category1 = new Category();
        category1.id = 1;
        category1.code = 1;
        category1.name = "cars";
        await connection.manager.save(category1);

        const category2 = new Category();
        category2.id = 2;
        category2.code = 2;
        category2.name = "BMW";
        await connection.manager.save(category2);

        const category3 = new Category();
        category3.id = 3;
        category3.code = 1;
        category3.name = "airplanes";
        await connection.manager.save(category3);

        const category4 = new Category();
        category4.id = 4;
        category4.code = 2;
        category4.name = "Boeing";
        await connection.manager.save(category4);

        const post1 = new Post();
        post1.id = 1;
        post1.authorId = 1;
        post1.title = "About BMW";
        post1.categories = [category1, category2];
        await connection.manager.save(post1);

        const post2 = new Post();
        post2.id = 2;
        post2.authorId = 1;
        post2.title = "About Boeing";
        post2.categories = [category3, category4];
        await connection.manager.save(post2);

        const loadedPosts = await connection.manager
            .createQueryBuilder(Post, "post")
            .loadRelationIdAndMap("post.categoryIds", "post.categories")
            .getMany();

        expect(loadedPosts[0].categoryIds).to.not.be.empty;
        expect(loadedPosts[0].categoryIds[0]).to.be.eql({id: 1, code: 1});
        expect(loadedPosts[0].categoryIds[1]).to.be.eql({id: 2, code: 2});
        expect(loadedPosts[1].categoryIds).to.not.be.empty;
        expect(loadedPosts[1].categoryIds[0]).to.be.eql({id: 3, code: 1});
        expect(loadedPosts[1].categoryIds[1]).to.be.eql({id: 4, code: 2});

        const loadedPost = await connection.manager
            .createQueryBuilder(Post, "post")
            .loadRelationIdAndMap("post.categoryIds", "post.categories")
            .where("post.id = :id", {id: 1})
            .andWhere("post.authorId = :authorId", {authorId: 1})
            .getOne();

        expect(loadedPost!.categoryIds).to.not.be.empty;
        expect(loadedPost!.categoryIds[0]).to.be.eql({id: 1, code: 1});
        expect(loadedPost!.categoryIds[1]).to.be.eql({id: 2, code: 2});

    })));

    it("should load ids when only one entity have multiple primary keys", () => Promise.all(connections.map(async connection => {

        const image1 = new Image();
        image1.name = "Image #1";
        await connection.manager.save(image1);

        const image2 = new Image();
        image2.name = "Image #2";
        await connection.manager.save(image2);

        const image3 = new Image();
        image3.name = "Image #3";
        await connection.manager.save(image3);

        const image4 = new Image();
        image4.name = "Image #4";
        await connection.manager.save(image4);

        const category1 = new Category();
        category1.id = 1;
        category1.code = 1;
        category1.name = "cars";
        category1.images = [image1, image2];
        await connection.manager.save(category1);

        const category2 = new Category();
        category2.id = 2;
        category2.code = 2;
        category2.name = "airplanes";
        category2.images = [image3, image4];
        await connection.manager.save(category2);

        const loadedCategories = await connection.manager
            .createQueryBuilder(Category, "category")
            .loadRelationIdAndMap("category.imageIds", "category.images")
            .getMany();

        expect(loadedCategories[0].imageIds).to.not.be.empty;
        expect(loadedCategories[0].imageIds[0]).to.be.equal(1);
        expect(loadedCategories[0].imageIds[1]).to.be.equal(2);
        expect(loadedCategories[1].imageIds).to.not.be.empty;
        expect(loadedCategories[1].imageIds[0]).to.be.equal(3);
        expect(loadedCategories[1].imageIds[1]).to.be.equal(4);

        const loadedCategory = await connection.manager
            .createQueryBuilder(Category, "category")
            .loadRelationIdAndMap("category.imageIds", "category.images")
            .where("category.id = :id", { id: 1 })
            .andWhere("category.code = :code", { code: 1 })
            .getOne();

        expect(loadedCategory!.imageIds).to.not.be.empty;
        expect(loadedCategory!.imageIds[0]).to.be.equal(1);
        expect(loadedCategory!.imageIds[1]).to.be.equal(2);

    })));

    it("should load ids when both entities have multiple primary keys and additional condition used", () => Promise.all(connections.map(async connection => {

        const category1 = new Category();
        category1.id = 1;
        category1.code = 1;
        category1.name = "cars";
        await connection.manager.save(category1);

        const category2 = new Category();
        category2.id = 2;
        category2.code = 1;
        category2.isRemoved = true;
        category2.name = "BMW";
        await connection.manager.save(category2);

        const category3 = new Category();
        category3.id = 3;
        category3.code = 1;
        category3.name = "airplanes";
        await connection.manager.save(category3);

        const category4 = new Category();
        category4.id = 4;
        category4.code = 2;
        category4.isRemoved = true;
        category4.name = "Boeing";
        await connection.manager.save(category4);

        const post1 = new Post();
        post1.id = 1;
        post1.authorId = 1;
        post1.title = "About BMW";
        post1.categories = [category1, category2];
        await connection.manager.save(post1);

        const post2 = new Post();
        post2.id = 2;
        post2.authorId = 1;
        post2.title = "About Boeing";
        post2.categories = [category3, category4];
        await connection.manager.save(post2);

        let loadedPosts = await connection.manager
            .createQueryBuilder(Post, "post")
            .loadRelationIdAndMap("post.categoryIds", "post.categories", "category", qb => qb.andWhere("category.id = :id AND category.code = :code", { id: 1, code: 1 }))
            .getMany();

        expect(loadedPosts[0].categoryIds).to.not.be.empty;
        expect(loadedPosts[0].categoryIds[0]).to.be.eql({ id: 1, code: 1 });
        expect(loadedPosts[1].categoryIds).to.be.empty;

        loadedPosts = await connection.manager
            .createQueryBuilder(Post, "post")
            .loadRelationIdAndMap("post.categoryIds", "post.categories", "category", qb => qb.andWhere("category.code = :code", { code: 1 }))
            .getMany();

        expect(loadedPosts[0].categoryIds).to.not.be.empty;
        expect(loadedPosts[0].categoryIds[0]).to.be.eql({ id: 1, code: 1 });
        expect(loadedPosts[0].categoryIds[1]).to.be.eql({ id: 2, code: 1 });
        expect(loadedPosts[1].categoryIds).to.not.be.empty;
        expect(loadedPosts[1].categoryIds[0]).to.be.eql({ id: 3, code: 1 });

        loadedPosts = await connection.manager
            .createQueryBuilder(Post, "post")
            .loadRelationIdAndMap("post.categoryIds", "post.categories", "category", qb => qb.andWhere("category.isRemoved = :isRemoved", { isRemoved: true }))
            .getMany();

        expect(loadedPosts[0].categoryIds).to.not.be.empty;
        expect(loadedPosts[0].categoryIds[0]).to.be.eql({ id: 2, code: 1 });
        expect(loadedPosts[1].categoryIds).to.not.be.empty;
        expect(loadedPosts[1].categoryIds[0]).to.be.eql({ id: 4, code: 2 });

        const loadedPost = await connection.manager
            .createQueryBuilder(Post, "post")
            .loadRelationIdAndMap("post.categoryIds", "post.categories", "category", qb => qb.andWhere("category.isRemoved = :isRemoved", { isRemoved: true }))
            .where("post.id = :id", { id: 1 })
            .andWhere("post.authorId = :authorId", { authorId: 1 })
            .getOne();

        expect(loadedPost!.categoryIds).to.not.be.empty;
        expect(loadedPost!.categoryIds[0]).to.be.eql({ id: 2, code: 1 });

    })));

    it("should load ids when loadRelationIdAndMap used on nested relation", () => Promise.all(connections.map(async connection => {

        const image1 = new Image();
        image1.name = "Image #1";
        await connection.manager.save(image1);

        const image2 = new Image();
        image2.name = "Image #2";
        await connection.manager.save(image2);

        const image3 = new Image();
        image3.name = "Image #3";
        await connection.manager.save(image3);

        const image4 = new Image();
        image4.name = "Image #4";
        await connection.manager.save(image4);

        const image5 = new Image();
        image5.name = "Image #5";
        await connection.manager.save(image5);

        const category1 = new Category();
        category1.id = 1;
        category1.code = 1;
        category1.name = "cars";
        category1.images = [image1, image2];
        await connection.manager.save(category1);

        const category2 = new Category();
        category2.id = 2;
        category2.code = 1;
        category2.name = "airplanes";
        category2.images = [image3, image4];
        await connection.manager.save(category2);

        const category3 = new Category();
        category3.id = 3;
        category3.code = 2;
        category3.name = "Boeing";
        category3.images = [image5];
        await connection.manager.save(category3);

        const post1 = new Post();
        post1.id = 1;
        post1.authorId = 1;
        post1.title = "About BMW";
        post1.categories = [category1];
        await connection.manager.save(post1);

        const post2 = new Post();
        post2.id = 2;
        post2.authorId = 1;
        post2.title = "About Boeing";
        post2.categories = [category2, category3];
        await connection.manager.save(post2);

        const loadedPosts = await connection.manager
            .createQueryBuilder(Post, "post")
            .loadRelationIdAndMap("post.categoryIds", "post.categories")
            .leftJoinAndSelect("post.categories", "category")
            .loadRelationIdAndMap("category.imageIds", "category.images")
            .orderBy("category.id")
            .getMany();

        expect(loadedPosts[0].categoryIds).to.not.be.empty;
        expect(loadedPosts[0].categoryIds.length).to.be.equal(1);
        expect(loadedPosts[0].categoryIds[0]).to.be.eql({ id: 1, code: 1 });
        expect(loadedPosts[0].categories).to.not.be.empty;
        expect(loadedPosts[0].categories[0].imageIds).to.not.be.empty;
        expect(loadedPosts[0].categories[0].imageIds.length).to.be.equal(2);
        expect(loadedPosts[0].categories[0].imageIds[0]).to.be.equal(1);
        expect(loadedPosts[0].categories[0].imageIds[1]).to.be.equal(2);
        expect(loadedPosts[1].categoryIds).to.not.be.empty;
        expect(loadedPosts[1].categoryIds.length).to.be.equal(2);
        expect(loadedPosts[1].categoryIds[0]).to.be.eql({ id: 2, code: 1 });
        expect(loadedPosts[1].categoryIds[1]).to.be.eql({ id: 3, code: 2 });
        expect(loadedPosts[1].categories).to.not.be.empty;
        expect(loadedPosts[1].categories.length).to.be.equal(2);
        expect(loadedPosts[1].categories[0].imageIds).to.not.be.empty;
        expect(loadedPosts[1].categories[0].imageIds.length).to.be.equal(2);
        expect(loadedPosts[1].categories[0].imageIds[0]).to.be.equal(3);
        expect(loadedPosts[1].categories[0].imageIds[1]).to.be.equal(4);
        expect(loadedPosts[1].categories[1].imageIds).to.not.be.empty;
        expect(loadedPosts[1].categories[1].imageIds.length).to.be.equal(1);
        expect(loadedPosts[1].categories[1].imageIds[0]).to.be.equal(5);

        const loadedPost = await connection.manager
            .createQueryBuilder(Post, "post")
            .loadRelationIdAndMap("post.categoryIds", "post.categories")
            .leftJoinAndSelect("post.categories", "category")
            .loadRelationIdAndMap("category.imageIds", "category.images")
            .where("post.id = :id", { id: 1 })
            .andWhere("post.authorId = :authorId", { authorId: 1 })
            .orderBy("category.id")
            .getOne();

        expect(loadedPost!.categoryIds).to.not.be.empty;
        expect(loadedPost!.categoryIds[0]).to.be.eql({ id: 1, code: 1 });
        expect(loadedPost!.categories).to.not.be.empty;
        expect(loadedPost!.categories[0].imageIds).to.not.be.empty;
        expect(loadedPost!.categories[0].imageIds.length).to.be.equal(2);
        expect(loadedPost!.categories[0].imageIds[0]).to.be.equal(1);
        expect(loadedPost!.categories[0].imageIds[1]).to.be.equal(2);

    })));

});