import "reflect-metadata";
import * as chai from "chai";
import {expect} from "chai";
import {Connection} from "../../../../src/connection/Connection";
import {Repository} from "../../../../src/repository/Repository";
import {Post} from "./entity/Post";
import {Category} from "./entity/Category";
import {CreateConnectionOptions} from "../../../../src/connection-manager/CreateConnectionOptions";
import {createConnection} from "../../../../src/backend";

chai.should();
chai.use(require("sinon-chai"));
chai.use(require("chai-as-promised"));

describe("repository > set/add/remove relation methods", function() {

    // -------------------------------------------------------------------------
    // Configuration
    // -------------------------------------------------------------------------

    const parameters: CreateConnectionOptions = {
        driver: "mysql",
        connection: {
            host: "192.168.99.100",
            port: 3306,
            username: "root",
            password: "admin",
            database: "test",
            autoSchemaCreate: true,
            logging: {
                // logQueries: true, // uncomment for debugging
                logFailedQueryError: true
            }
        },
        entities: [Post, Category]
    };
    // connect to db
    let connection: Connection;
    before(function() {
        return createConnection(parameters)
            .then(con => connection = con)
            .catch(e => {
                console.log("Error during connection to db: " + e);
                throw e;
            });
    });

    after(function() {
        connection.close();
    });

    // clean up database before each test
    function reloadDatabase() {
        return connection.syncSchema(true)
            .catch(e => console.log("Error during schema re-creation: ", e));
    }

    let postRepository: Repository<Post>;
    let categoryRepository: Repository<Category>;
    before(function() {
        postRepository = connection.getRepository(Post);
        categoryRepository = connection.getRepository(Category);
    });

    // -------------------------------------------------------------------------
    // Specifications
    // -------------------------------------------------------------------------
    
    describe("add elements to many-to-many from owner side", function() {
        let newPost: Post, newCategory1: Category, newCategory2: Category, loadedPost: Post;

        before(reloadDatabase);

        // save a new category
        before(function () {
            newCategory1 = categoryRepository.create();
            newCategory1.name = "Animals";
            return categoryRepository.persist(newCategory1);
        });

        // save a new category
        before(function () {
            newCategory2 = categoryRepository.create();
            newCategory2.name = "Kids";
            return categoryRepository.persist(newCategory2);
        });

        // save a new post
        before(function() {
            newPost = postRepository.create();
            newPost.title = "Super post";
            return postRepository.persist(newPost);
        });

        // add categories to a post
        before(function() {
            return postRepository.addToRelation(post => post.manyCategories, newPost.id, [newCategory1.id, newCategory2.id]);
        });

        // load a post, want to have categories count
        before(function() {
            return postRepository
                .findOneById(1, { alias: "post", leftJoinAndSelect: { manyCategories: "post.manyCategories" } })
                .then(post => loadedPost = post);
        });

        it("should save successfully", function () {
            expect(loadedPost).not.to.be.empty;
            expect(loadedPost.manyCategories).not.to.be.empty;
            if (loadedPost.manyCategories) {
                expect(loadedPost.manyCategories[0]).not.to.be.empty;
                expect(loadedPost.manyCategories[1]).not.to.be.empty;
            }
        });

    });
    
    describe("add elements to many-to-many from inverse side", function() {
        let newPost1: Post, newPost2: Post, newCategory: Category, loadedCategory: Category;

        before(reloadDatabase);

        // save a new post
        before(function () {
            newPost1 = postRepository.create();
            newPost1.title = "post #1";
            return postRepository.persist(newPost1);
        });

        // save a new post
        before(function () {
            newPost2 = postRepository.create();
            newPost2.title = "post #2";
            return postRepository.persist(newPost2);
        });

        // save a new category
        before(function () {
            newCategory = categoryRepository.create();
            newCategory.name = "Kids";
            return categoryRepository.persist(newCategory);
        });

        // add categories to a post
        before(function() {
            return categoryRepository.addToRelation(category => category.manyPosts, newCategory.id, [newPost1.id, newPost2.id]);
        });

        // load a post, want to have categories count
        before(function() {
            return categoryRepository
                .findOneById(1, { alias: "category", leftJoinAndSelect: { manyPosts: "category.manyPosts" } })
                .then(category => loadedCategory = category);
        });

        it("should save successfully", function () {
            expect(loadedCategory).not.to.be.empty;
            expect(loadedCategory.manyPosts).not.to.be.empty;
            if (loadedCategory.manyPosts) {
                expect(loadedCategory.manyPosts[0]).not.to.be.empty;
                expect(loadedCategory.manyPosts[1]).not.to.be.empty;
            }
        });

    });

    describe("remove elements to many-to-many from owner side", function() {
        let newPost: Post, newCategory1: Category, newCategory2: Category, newCategory3: Category, loadedPost: Post;

        before(reloadDatabase);

        // save a new category
        before(function () {
            newCategory1 = categoryRepository.create();
            newCategory1.name = "Animals";
            return categoryRepository.persist(newCategory1);
        });

        // save a new category
        before(function () {
            newCategory2 = categoryRepository.create();
            newCategory2.name = "Kids";
            return categoryRepository.persist(newCategory2);
        });

        // save a new category
        before(function () {
            newCategory3 = categoryRepository.create();
            newCategory3.name = "Adults";
            return categoryRepository.persist(newCategory3);
        });

        // save a new post with categories
        before(function() {
            newPost = postRepository.create();
            newPost.title = "Super post";
            newPost.manyCategories = [newCategory1, newCategory2, newCategory3];
            return postRepository.persist(newPost);
        });

        // add categories to a post
        before(function() {
            return postRepository.removeFromRelation(post => post.manyCategories, newPost.id, [newCategory1.id, newCategory3.id]);
        });

        // load a post, want to have categories count
        before(function() {
            return postRepository
                .findOneById(1, { alias: "post", leftJoinAndSelect: { manyCategories: "post.manyCategories" } })
                .then(post => loadedPost = post);
        });

        it("should remove successfully", function () {
            expect(loadedPost).not.to.be.empty;
            expect(loadedPost.manyCategories).not.to.be.empty;
            loadedPost.manyCategories.length.should.be.equal(1);
            if (loadedPost.manyCategories) {
                loadedPost.manyCategories[0].name.should.be.equal("Kids");
            }
        });

    });

    describe("remove elements to many-to-many from inverse side", function() {
        let newCategory: Category, newPost1: Post, newPost2: Post, newPost3: Post, loadedCategory: Category;

        before(reloadDatabase);

        // save a new category
        before(function () {
            newPost1 = postRepository.create();
            newPost1.title = "post #1";
            return postRepository.persist(newPost1);
        });

        // save a new category
        before(function () {
            newPost2 = postRepository.create();
            newPost2.title = "post #2";
            return postRepository.persist(newPost2);
        });

        // save a new category
        before(function () {
            newPost3 = postRepository.create();
            newPost3.title = "post #3";
            return postRepository.persist(newPost3);
        });

        // save a new post with categories
        before(function() {
            newCategory = categoryRepository.create();
            newCategory.name = "SuperCategory";
            newCategory.manyPosts = [newPost1, newPost2, newPost3];
            return categoryRepository.persist(newCategory);
        });

        // add categories to a post
        before(function() {
            return categoryRepository.removeFromRelation(post => post.manyPosts, newCategory.id, [newPost1.id, newPost3.id]);
        });

        // load a post, want to have categories count
        before(function() {
            return categoryRepository
                .findOneById(1, { alias: "category", leftJoinAndSelect: { manyPosts: "category.manyPosts" } })
                .then(category => loadedCategory = category);
        });

        it("should remove successfully", function () {
            expect(loadedCategory).not.to.be.empty;
            expect(loadedCategory.manyPosts).not.to.be.empty;
            loadedCategory.manyPosts.length.should.be.equal(1);
            if (loadedCategory.manyPosts) {
                loadedCategory.manyPosts[0].title.should.be.equal("post #2");
            }
        });

    });

    describe("set element to one-to-many relation", function() {
        let newPost: Post, newCategory1: Category, loadedPost: Post;

        before(reloadDatabase);

        // save a new category
        before(function () {
            newCategory1 = categoryRepository.create();
            newCategory1.name = "Animals";
            return categoryRepository.persist(newCategory1);
        });

        // save a new post
        before(function() {
            newPost = postRepository.create();
            newPost.title = "Super post";
            return postRepository.persist(newPost);
        });

        // add categories to a post
        before(function() {
            return postRepository.setRelation(post => post.categories, newPost.id, newCategory1.id);
        });

        // load a post, want to have categories count
        before(function() {
            return postRepository
                .findOneById(1, { alias: "post", leftJoinAndSelect: { categories: "post.categories" } })
                .then(post => loadedPost = post);
        });

        it("should save successfully", function () {
            expect(loadedPost).not.to.be.empty;
            expect(loadedPost.categories).not.to.be.empty;
            if (loadedPost.categories) {
                expect(loadedPost.categories[0]).not.to.be.empty;
            }
        });

    });

    describe("set element to many-to-one relation", function() {
        let newCategory: Category, newPost: Post, loadedCategory: Category;

        before(reloadDatabase);

        // save a new category
        before(function () {
            newPost = postRepository.create();
            newPost.title = "post #1";
            return postRepository.persist(newPost);
        });

        // save a new category
        before(function () {
            newCategory = categoryRepository.create();
            newCategory.name = "Kids";
            return categoryRepository.persist(newCategory);
        });

        // add categories to a post
        before(function() {
            return categoryRepository.setRelation(category => category.post, newCategory.id, newPost.id);
        });

        // load a post, want to have categories count
        before(function() {
            return categoryRepository
                .findOneById(1, { alias: "category", leftJoinAndSelect: { post: "category.post" } })
                .then(category => loadedCategory = category);
        });

        it("should save successfully", function () {
            expect(loadedCategory).not.to.be.empty;
            expect(loadedCategory.post).not.to.be.empty;
        });

    });

    describe("set element to NULL in one-to-many relation", function() {
        let newPost: Post, newCategory1: Category, loadedPost: Post;

        before(reloadDatabase);

        // save a new category
        before(function () {
            newCategory1 = categoryRepository.create();
            newCategory1.name = "Animals";
            return categoryRepository.persist(newCategory1);
        });

        // save a new post
        before(function() {
            newPost = postRepository.create();
            newPost.title = "Super post";
            newPost.categories = [newCategory1];
            return postRepository.persist(newPost);
        });

        // add categories to a post
        before(function() {
            return postRepository.setRelation(post => post.categories, newPost.id, null);
        });

        // load a post, want to have categories count
        before(function() {
            return postRepository
                .findOneById(1, { alias: "post", leftJoinAndSelect: { categories: "post.categories" } })
                .then(post => loadedPost = post);
        });

        it("should save successfully", function () {
            expect(loadedPost).not.to.be.empty;
            expect(loadedPost.categories).to.be.empty;
        });

    });

    describe("set element to NULL in many-to-one relation", function() {
        let newCategory: Category, newPost: Post, loadedCategory: Category;

        before(reloadDatabase);

        // save a new category
        before(function () {
            newPost = postRepository.create();
            newPost.title = "post #1";
            return postRepository.persist(newPost);
        });

        // save a new category
        before(function () {
            newCategory = categoryRepository.create();
            newCategory.name = "Kids";
            newCategory.post = newPost;
            return categoryRepository.persist(newCategory);
        });

        // add categories to a post
        before(function() {
            return categoryRepository.setRelation(category => category.post, newCategory.id, null);
        });

        // load a post, want to have categories count
        before(function() {
            return categoryRepository
                .findOneById(1, { alias: "category", leftJoinAndSelect: { post: "category.post" } })
                .then(category => loadedCategory = category);
        });

        it("should save successfully", function () {
            expect(loadedCategory).not.to.be.empty;
            expect(loadedCategory.post).to.be.empty;
        });

    });

});