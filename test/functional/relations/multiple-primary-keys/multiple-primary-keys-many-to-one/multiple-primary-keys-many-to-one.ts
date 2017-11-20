import "reflect-metadata";
import {expect} from "chai";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../../../utils/test-utils";
import {Connection} from "../../../../../src/connection/Connection";
import {Post} from "./entity/Post";
import {Category} from "./entity/Category";

describe("relations > multiple-primary-keys > many-to-one", () => {
    
    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    describe("owning side", () => {

        it("should load related entity when JoinColumn is not specified", () => Promise.all(connections.map(async connection => {

            const category1 = new Category();
            category1.name = "cars";
            category1.type = "common-category";
            category1.code = 1;
            category1.version = 1;
            await connection.manager.save(category1);

            const category2 = new Category();
            category2.name = "airplanes";
            category2.type = "common-category";
            category2.code = 2;
            category2.version = 1;
            await connection.manager.save(category2);

            const post1 = new Post();
            post1.title = "About BMW";
            post1.category = category1;
            await connection.manager.save(post1);

            const post2 = new Post();
            post2.title = "About Boeing";
            post2.category = category2;
            await connection.manager.save(post2);

            const loadedPosts = await connection.manager
                .createQueryBuilder(Post, "post")
                .leftJoinAndSelect("post.category", "category")
                .orderBy("post.id")
                .getMany();

            expect(loadedPosts[0].category).to.not.be.empty;
            expect(loadedPosts[0].category.name).to.be.equal("cars");
            expect(loadedPosts[0].category.type).to.be.equal("common-category");
            expect(loadedPosts[1].category).to.not.be.empty;
            expect(loadedPosts[1].category.name).to.be.equal("airplanes");
            expect(loadedPosts[1].category.type).to.be.equal("common-category");

            const loadedPost = await connection.manager
                .createQueryBuilder(Post, "post")
                .leftJoinAndSelect("post.category", "category")
                .where("post.id = :id", {id: 1})
                .getOne();

            expect(loadedPost!.category).to.not.be.empty;
            expect(loadedPost!.category.name).to.be.equal("cars");
            expect(loadedPost!.category.type).to.be.equal("common-category");

        })));

        it("should load related entity when JoinColumn is specified without options", () => Promise.all(connections.map(async connection => {

            const category1 = new Category();
            category1.name = "cars";
            category1.type = "common-category";
            category1.code = 1;
            category1.version = 1;
            await connection.manager.save(category1);

            const category2 = new Category();
            category2.name = "airplanes";
            category2.type = "common-category";
            category2.code = 2;
            category2.version = 1;
            await connection.manager.save(category2);

            const post1 = new Post();
            post1.title = "About BMW";
            post1.categoryWithEmptyJoinColumn = category1;
            await connection.manager.save(post1);

            const post2 = new Post();
            post2.title = "About Boeing";
            post2.categoryWithEmptyJoinColumn = category2;
            await connection.manager.save(post2);

            const loadedPosts = await connection.manager
                .createQueryBuilder(Post, "post")
                .leftJoinAndSelect("post.categoryWithEmptyJoinColumn", "category")
                .orderBy("post.id")
                .getMany();

            expect(loadedPosts[0].categoryWithEmptyJoinColumn).to.not.be.empty;
            expect(loadedPosts[0].categoryWithEmptyJoinColumn.name).to.be.equal("cars");
            expect(loadedPosts[0].categoryWithEmptyJoinColumn.type).to.be.equal("common-category");
            expect(loadedPosts[1].categoryWithEmptyJoinColumn).to.not.be.empty;
            expect(loadedPosts[1].categoryWithEmptyJoinColumn.name).to.be.equal("airplanes");
            expect(loadedPosts[1].categoryWithEmptyJoinColumn.type).to.be.equal("common-category");

            const loadedPost = await connection.manager
                .createQueryBuilder(Post, "post")
                .leftJoinAndSelect("post.categoryWithEmptyJoinColumn", "category")
                .where("post.id = :id", {id: 1})
                .getOne();

            expect(loadedPost!.categoryWithEmptyJoinColumn).to.not.be.empty;
            expect(loadedPost!.categoryWithEmptyJoinColumn.name).to.be.equal("cars");
            expect(loadedPost!.categoryWithEmptyJoinColumn.type).to.be.equal("common-category");

        })));

        it("should load related entity when JoinColumn is specified with options", () => Promise.all(connections.map(async connection => {

            const category1 = new Category();
            category1.name = "cars";
            category1.type = "common-category";
            category1.code = 1;
            category1.version = 1;
            await connection.manager.save(category1);

            const category2 = new Category();
            category2.name = "airplanes";
            category2.type = "common-category";
            category2.code = 2;
            category2.version = 1;
            await connection.manager.save(category2);

            const post1 = new Post();
            post1.title = "About BMW";
            post1.categoryWithOptions = category1;
            await connection.manager.save(post1);

            const post2 = new Post();
            post2.title = "About Boeing";
            post2.categoryWithOptions = category2;
            await connection.manager.save(post2);

            const loadedPosts = await connection.manager
                .createQueryBuilder(Post, "post")
                .leftJoinAndSelect("post.categoryWithOptions", "category")
                .orderBy("post.id")
                .getMany();

            expect(loadedPosts[0].categoryWithOptions).to.not.be.empty;
            expect(loadedPosts[0].categoryWithOptions.name).to.be.equal("cars");
            expect(loadedPosts[0].categoryWithOptions.type).to.be.equal("common-category");
            expect(loadedPosts[1].categoryWithOptions).to.not.be.empty;
            expect(loadedPosts[1].categoryWithOptions.name).to.be.equal("airplanes");
            expect(loadedPosts[1].categoryWithOptions.type).to.be.equal("common-category");

            const loadedPost = await connection.manager
                .createQueryBuilder(Post, "post")
                .leftJoinAndSelect("post.categoryWithOptions", "category")
                .where("post.id = :id", {id: 1})
                .getOne();

            expect(loadedPost!.categoryWithOptions).to.not.be.empty;
            expect(loadedPost!.categoryWithOptions.name).to.be.equal("cars");
            expect(loadedPost!.categoryWithOptions.type).to.be.equal("common-category");

        })));

        it("should load related entity when JoinColumn references on to non-primary columns", () => Promise.all(connections.map(async connection => {

            const category1 = new Category();
            category1.name = "cars";
            category1.type = "common-category";
            category1.code = 1;
            category1.version = 1;
            category1.description = "category about cars";
            await connection.manager.save(category1);

            const category2 = new Category();
            category2.name = "airplanes";
            category2.type = "common-category";
            category2.code = 2;
            category2.version = 1;
            category2.description = "category about airplanes";
            await connection.manager.save(category2);

            const post1 = new Post();
            post1.title = "About BMW";
            post1.categoryWithNonPrimaryColumns = category1;
            await connection.manager.save(post1);

            const post2 = new Post();
            post2.title = "About Boeing";
            post2.categoryWithNonPrimaryColumns = category2;
            await connection.manager.save(post2);

            const loadedPosts = await connection.manager
                .createQueryBuilder(Post, "post")
                .leftJoinAndSelect("post.categoryWithNonPrimaryColumns", "category")
                .orderBy("post.id")
                .getMany();

            expect(loadedPosts[0].categoryWithNonPrimaryColumns).to.not.be.empty;
            expect(loadedPosts[0].categoryWithNonPrimaryColumns.code).to.be.equal(1);
            expect(loadedPosts[0].categoryWithNonPrimaryColumns.version).to.be.equal(1);
            expect(loadedPosts[0].categoryWithNonPrimaryColumns.description).to.be.equal("category about cars");
            expect(loadedPosts[1].categoryWithNonPrimaryColumns).to.not.be.empty;
            expect(loadedPosts[1].categoryWithNonPrimaryColumns.code).to.be.equal(2);
            expect(loadedPosts[1].categoryWithNonPrimaryColumns.version).to.be.equal(1);

            const loadedPost = await connection.manager
                .createQueryBuilder(Post, "post")
                .leftJoinAndSelect("post.categoryWithNonPrimaryColumns", "category")
                .where("post.id = :id", {id: 1})
                .getOne();

            expect(loadedPost!.categoryWithNonPrimaryColumns).to.not.be.empty;
            expect(loadedPost!.categoryWithNonPrimaryColumns.code).to.be.equal(1);
            expect(loadedPost!.categoryWithNonPrimaryColumns.version).to.be.equal(1);
            expect(loadedPost!.categoryWithNonPrimaryColumns.description).to.be.equal("category about cars");

        })));
    });

    describe("inverse side", () => {

        it("should load related entity when JoinColumn is not specified", () => Promise.all(connections.map(async connection => {

            const post1 = new Post();
            post1.title = "About BMW";
            await connection.manager.save(post1);

            const post2 = new Post();
            post2.title = "About Audi";
            await connection.manager.save(post2);

            const post3 = new Post();
            post3.title = "About Boeing";
            await connection.manager.save(post3);

            const category1 = new Category();
            category1.name = "cars";
            category1.type = "common-category";
            category1.code = 1;
            category1.version = 1;
            category1.posts = [post1, post2];
            await connection.manager.save(category1);

            const category2 = new Category();
            category2.name = "airplanes";
            category2.type = "common-category";
            category2.code = 2;
            category2.version = 1;
            category2.posts = [post3];
            await connection.manager.save(category2);

            const loadedCategories = await connection.manager
                .createQueryBuilder(Category, "category")
                .leftJoinAndSelect("category.posts", "posts")
                .orderBy("category.code, posts.id")
                .getMany();

            expect(loadedCategories[0].posts).to.not.be.empty;
            expect(loadedCategories[0].posts[0].id).to.be.equal(1);
            expect(loadedCategories[0].posts[0].title).to.be.equal("About BMW");
            expect(loadedCategories[0].posts[1].id).to.be.equal(2);
            expect(loadedCategories[0].posts[1].title).to.be.equal("About Audi");
            expect(loadedCategories[1].posts).to.not.be.empty;
            expect(loadedCategories[1].posts[0].id).to.be.equal(3);
            expect(loadedCategories[1].posts[0].title).to.be.equal("About Boeing");

            const loadedCategory = await connection.manager
                .createQueryBuilder(Category, "category")
                .leftJoinAndSelect("category.posts", "posts")
                .orderBy("posts.id")
                .where("category.code = :code", {code: 1})
                .getOne();

            expect(loadedCategory!.posts).to.not.be.empty;
            expect(loadedCategory!.posts[0].id).to.be.equal(1);
            expect(loadedCategory!.posts[0].title).to.be.equal("About BMW");
            expect(loadedCategory!.posts[1].id).to.be.equal(2);
            expect(loadedCategory!.posts[1].title).to.be.equal("About Audi");

        })));

        it("should load related entity when JoinColumn is specified without options", () => Promise.all(connections.map(async connection => {

            const post1 = new Post();
            post1.title = "About BMW";
            await connection.manager.save(post1);

            const post2 = new Post();
            post2.title = "About Audi";
            await connection.manager.save(post2);

            const post3 = new Post();
            post3.title = "About Boeing";
            await connection.manager.save(post3);

            const category1 = new Category();
            category1.name = "cars";
            category1.type = "common-category";
            category1.code = 1;
            category1.version = 1;
            category1.postsWithEmptyJoinColumn = [post1, post2];
            await connection.manager.save(category1);

            const category2 = new Category();
            category2.name = "airplanes";
            category2.type = "common-category";
            category2.code = 2;
            category2.version = 1;
            category2.postsWithEmptyJoinColumn = [post3];
            await connection.manager.save(category2);

            const loadedCategories = await connection.manager
                .createQueryBuilder(Category, "category")
                .leftJoinAndSelect("category.postsWithEmptyJoinColumn", "posts")
                .orderBy("category.code, posts.id")
                .getMany();

            expect(loadedCategories[0].postsWithEmptyJoinColumn).to.not.be.empty;
            expect(loadedCategories[0].postsWithEmptyJoinColumn[0].id).to.be.equal(1);
            expect(loadedCategories[0].postsWithEmptyJoinColumn[0].title).to.be.equal("About BMW");
            expect(loadedCategories[0].postsWithEmptyJoinColumn[1].id).to.be.equal(2);
            expect(loadedCategories[0].postsWithEmptyJoinColumn[1].title).to.be.equal("About Audi");
            expect(loadedCategories[1].postsWithEmptyJoinColumn).to.not.be.empty;
            expect(loadedCategories[1].postsWithEmptyJoinColumn[0].id).to.be.equal(3);
            expect(loadedCategories[1].postsWithEmptyJoinColumn[0].title).to.be.equal("About Boeing");

            const loadedCategory = await connection.manager
                .createQueryBuilder(Category, "category")
                .leftJoinAndSelect("category.postsWithEmptyJoinColumn", "posts")
                .orderBy("posts.id")
                .where("category.code = :code", {code: 1})
                .getOne();

            expect(loadedCategory!.postsWithEmptyJoinColumn).to.not.be.empty;
            expect(loadedCategory!.postsWithEmptyJoinColumn[0].id).to.be.equal(1);
            expect(loadedCategory!.postsWithEmptyJoinColumn[0].title).to.be.equal("About BMW");
            expect(loadedCategory!.postsWithEmptyJoinColumn[1].id).to.be.equal(2);
            expect(loadedCategory!.postsWithEmptyJoinColumn[1].title).to.be.equal("About Audi");

        })));

        it("should load related entity when JoinColumn is specified with options", () => Promise.all(connections.map(async connection => {

            const post1 = new Post();
            post1.title = "About BMW";
            await connection.manager.save(post1);

            const post2 = new Post();
            post2.title = "About Audi";
            await connection.manager.save(post2);

            const post3 = new Post();
            post3.title = "About Boeing";
            await connection.manager.save(post3);

            const category1 = new Category();
            category1.name = "cars";
            category1.type = "common-category";
            category1.code = 1;
            category1.version = 1;
            category1.postsWithOptions = [post1, post2];
            await connection.manager.save(category1);

            const category2 = new Category();
            category2.name = "airplanes";
            category2.type = "common-category";
            category2.code = 2;
            category2.version = 1;
            category2.postsWithOptions = [post3];
            await connection.manager.save(category2);

            const loadedCategories = await connection.manager
                .createQueryBuilder(Category, "category")
                .leftJoinAndSelect("category.postsWithOptions", "posts")
                .orderBy("category.code, posts.id")
                .getMany();

            expect(loadedCategories[0].postsWithOptions).to.not.be.empty;
            expect(loadedCategories[0].postsWithOptions[0].id).to.be.equal(1);
            expect(loadedCategories[0].postsWithOptions[0].title).to.be.equal("About BMW");
            expect(loadedCategories[0].postsWithOptions[1].id).to.be.equal(2);
            expect(loadedCategories[0].postsWithOptions[1].title).to.be.equal("About Audi");
            expect(loadedCategories[1].postsWithOptions).to.not.be.empty;
            expect(loadedCategories[1].postsWithOptions[0].id).to.be.equal(3);
            expect(loadedCategories[1].postsWithOptions[0].title).to.be.equal("About Boeing");

            const loadedCategory = await connection.manager
                .createQueryBuilder(Category, "category")
                .leftJoinAndSelect("category.postsWithOptions", "posts")
                .orderBy("posts.id")
                .where("category.code = :code", {code: 1})
                .getOne();

            expect(loadedCategory!.postsWithOptions).to.not.be.empty;
            expect(loadedCategory!.postsWithOptions[0].id).to.be.equal(1);
            expect(loadedCategory!.postsWithOptions[0].title).to.be.equal("About BMW");
            expect(loadedCategory!.postsWithOptions[1].id).to.be.equal(2);
            expect(loadedCategory!.postsWithOptions[1].title).to.be.equal("About Audi");

        })));

        it("should load related entity when JoinColumn references on to non-primary columns", () => Promise.all(connections.map(async connection => {

            const post1 = new Post();
            post1.title = "About BMW";
            await connection.manager.save(post1);

            const post2 = new Post();
            post2.title = "About Audi";
            await connection.manager.save(post2);

            const post3 = new Post();
            post3.title = "About Boeing";
            await connection.manager.save(post3);

            const category1 = new Category();
            category1.name = "cars";
            category1.type = "common-category";
            category1.code = 1;
            category1.version = 1;
            category1.description = "category of cars";
            category1.postsWithNonPrimaryColumns = [post1, post2];
            await connection.manager.save(category1);

            const category2 = new Category();
            category2.name = "airplanes";
            category2.type = "common-category";
            category2.code = 2;
            category2.version = 1;
            category2.description = "category of airplanes";
            category2.postsWithNonPrimaryColumns = [post3];
            await connection.manager.save(category2);

            const loadedCategories = await connection.manager
                .createQueryBuilder(Category, "category")
                .leftJoinAndSelect("category.postsWithNonPrimaryColumns", "posts")
                .orderBy("category.code, posts.id")
                .getMany();

            expect(loadedCategories[0].postsWithNonPrimaryColumns).to.not.be.empty;
            expect(loadedCategories[0].postsWithNonPrimaryColumns[0].id).to.be.equal(1);
            expect(loadedCategories[0].postsWithNonPrimaryColumns[0].title).to.be.equal("About BMW");
            expect(loadedCategories[0].postsWithNonPrimaryColumns[1].id).to.be.equal(2);
            expect(loadedCategories[0].postsWithNonPrimaryColumns[1].title).to.be.equal("About Audi");
            expect(loadedCategories[1].postsWithNonPrimaryColumns).to.not.be.empty;
            expect(loadedCategories[1].postsWithNonPrimaryColumns[0].id).to.be.equal(3);
            expect(loadedCategories[1].postsWithNonPrimaryColumns[0].title).to.be.equal("About Boeing");

            const loadedCategory = await connection.manager
                .createQueryBuilder(Category, "category")
                .leftJoinAndSelect("category.postsWithNonPrimaryColumns", "posts")
                .orderBy("posts.id")
                .where("category.code = :code", {code: 1})
                .getOne();

            expect(loadedCategory!.postsWithNonPrimaryColumns).to.not.be.empty;
            expect(loadedCategory!.postsWithNonPrimaryColumns[0].id).to.be.equal(1);
            expect(loadedCategory!.postsWithNonPrimaryColumns[0].title).to.be.equal("About BMW");
            expect(loadedCategory!.postsWithNonPrimaryColumns[1].id).to.be.equal(2);
            expect(loadedCategory!.postsWithNonPrimaryColumns[1].title).to.be.equal("About Audi");

        })));

    });

});