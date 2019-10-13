"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../../utils/test-utils");
var Post_1 = require("./entity/Post");
var QueryBuilder_1 = require("../../../../src/query-builder/QueryBuilder");
var QuestionSchema_1 = require("./model-schema/QuestionSchema");
var Blog_1 = require("./entity/Blog");
var Category_1 = require("./entity/Category");
var src_1 = require("../../../../src");
describe("repository > basic methods", function () {
    var userSchema;
    try {
        var resourceDir = __dirname + "/../../../../../../test/functional/repository/basic-methods/";
        userSchema = require(resourceDir + "schema/user.json");
    }
    catch (err) {
        var resourceDir = __dirname + "/";
        userSchema = require(resourceDir + "schema/user.json");
    }
    var UserEntity = new src_1.EntitySchema(userSchema);
    var QuestionEntity = new src_1.EntitySchema(QuestionSchema_1.default);
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [Post_1.Post, Blog_1.Blog, Category_1.Category, UserEntity, QuestionEntity],
                    })];
                case 1: return [2 /*return*/, connections = _a.sent()];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    describe("target", function () {
        it("should return instance of the object it manages", function () { return connections.forEach(function (connection) {
            var postRepository = connection.getRepository(Post_1.Post);
            postRepository.target.should.be.equal(Post_1.Post);
            var userRepository = connection.getRepository("User");
            userRepository.target.should.be.equal("User");
            var questionRepository = connection.getRepository("Question");
            questionRepository.target.should.be.instanceOf(Function);
        }); });
    });
    describe("hasId", function () {
        it("should return true if entity has an id", function () { return connections.forEach(function (connection) {
            var postRepository = connection.getRepository(Post_1.Post);
            var userRepository = connection.getRepository("User");
            var postWithId = new Post_1.Post();
            postWithId.id = 1;
            postWithId.title = "Hello post";
            postRepository.hasId(postWithId).should.be.equal(true);
            var postWithZeroId = new Post_1.Post();
            postWithZeroId.id = 0;
            postWithZeroId.title = "Hello post";
            postRepository.hasId(postWithZeroId).should.be.equal(true);
            var userWithId = {
                id: 1,
                firstName: "Jonh",
                secondName: "Doe"
            };
            userRepository.hasId(userWithId).should.be.equal(true);
            var userWithZeroId = {
                id: 1,
                firstName: "Jonh",
                secondName: "Doe"
            };
            userRepository.hasId(userWithZeroId).should.be.equal(true);
        }); });
        it("should return false if entity does not have an id", function () { return connections.forEach(function (connection) {
            var postRepository = connection.getRepository(Post_1.Post);
            var userRepository = connection.getRepository("User");
            postRepository.hasId(null).should.be.equal(false);
            postRepository.hasId(undefined).should.be.equal(false);
            var postWithoutId = new Post_1.Post();
            postWithoutId.title = "Hello post";
            postRepository.hasId(postWithoutId).should.be.equal(false);
            var postWithUndefinedId = new Post_1.Post();
            postWithUndefinedId.id = undefined;
            postWithUndefinedId.title = "Hello post";
            postRepository.hasId(postWithUndefinedId).should.be.equal(false);
            var postWithNullId = new Post_1.Post();
            postWithNullId.id = null;
            postWithNullId.title = "Hello post";
            postRepository.hasId(postWithNullId).should.be.equal(false);
            var postWithEmptyId = new Post_1.Post();
            postWithEmptyId.id = "";
            postWithEmptyId.title = "Hello post";
            postRepository.hasId(postWithEmptyId).should.be.equal(false);
            var userWithoutId = {
                firstName: "Jonh",
                secondName: "Doe"
            };
            userRepository.hasId(userWithoutId).should.be.equal(false);
            var userWithNullId = {
                id: null,
                firstName: "Jonh",
                secondName: "Doe"
            };
            userRepository.hasId(userWithNullId).should.be.equal(false);
            var userWithUndefinedId = {
                id: undefined,
                firstName: "Jonh",
                secondName: "Doe"
            };
            userRepository.hasId(userWithUndefinedId).should.be.equal(false);
        }); });
    });
    describe("createQueryBuilder", function () {
        it("should create a new query builder with the given alias", function () { return connections.forEach(function (connection) {
            var postRepository = connection.getRepository(Post_1.Post);
            var postQb = postRepository.createQueryBuilder("post");
            postQb.should.be.instanceOf(QueryBuilder_1.QueryBuilder);
            postQb.alias.should.be.equal("post");
            var userRepository = connection.getRepository("User");
            var userQb = userRepository.createQueryBuilder("user");
            userQb.should.be.instanceOf(QueryBuilder_1.QueryBuilder);
            userQb.alias.should.be.equal("user");
            var questionRepository = connection.getRepository("Question");
            var questionQb = questionRepository.createQueryBuilder("question");
            questionQb.should.be.instanceOf(QueryBuilder_1.QueryBuilder);
            questionQb.alias.should.be.equal("question");
        }); });
    });
    describe("create", function () {
        it("should create a new instance of the object we are working with", function () { return connections.forEach(function (connection) {
            var repository = connection.getRepository(Post_1.Post);
            repository.create().should.be.instanceOf(Post_1.Post);
        }); });
        it("should create a new empty object if entity schema is used", function () { return connections.forEach(function (connection) {
            var repository = connection.getRepository("User");
            repository.create().should.be.eql({});
        }); });
        it("should create a new empty object if entity schema with a target is used", function () { return connections.forEach(function (connection) {
            var repository = connection.getRepository("Question");
            repository.create().should.not.be.undefined;
            repository.create().should.not.be.null;
            repository.create().type.should.be.equal("question"); // make sure this is our Question function
        }); });
        it("should create an entity and copy to it all properties of the given plain object if its given", function () { return connections.forEach(function (connection) {
            var postRepository = connection.getRepository(Post_1.Post);
            var userRepository = connection.getRepository("User");
            var questionRepository = connection.getRepository("Question");
            var plainPost = { id: 2, title: "Hello post" };
            var post = postRepository.create(plainPost);
            post.should.be.instanceOf(Post_1.Post);
            post.id.should.be.equal(2);
            post.title.should.be.equal("Hello post");
            var plainUser = { id: 3, firstName: "John", secondName: "Doe" };
            var user = userRepository.create(plainUser);
            user.id.should.be.equal(3);
            user.firstName.should.be.equal("John");
            user.secondName.should.be.equal("Doe");
            var plainQuestion = { id: 3, title: "What is better?" };
            var question = questionRepository.create(plainQuestion);
            question.id.should.be.equal(3);
            question.title.should.be.equal("What is better?");
        }); });
    });
    describe("createMany", function () {
        it("should create entities and copy to them all properties of the given plain object if its given", function () { return connections.forEach(function (connection) {
            var postRepository = connection.getRepository(Post_1.Post);
            var plainPosts = [{ id: 2, title: "Hello post" }, { id: 3, title: "Bye post" }];
            var posts = postRepository.create(plainPosts);
            posts.length.should.be.equal(2);
            posts[0].should.be.instanceOf(Post_1.Post);
            posts[0].id.should.be.equal(2);
            posts[0].title.should.be.equal("Hello post");
            posts[1].should.be.instanceOf(Post_1.Post);
            posts[1].id.should.be.equal(3);
            posts[1].title.should.be.equal("Bye post");
        }); });
    });
    describe("preload", function () {
        var _this = this;
        it("should preload entity from the given object with only id", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var blogRepository, categoryRepository, category, blog, plainBlogWithId, preloadedBlog;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        blogRepository = connection.getRepository(Blog_1.Blog);
                        categoryRepository = connection.getRepository(Category_1.Category);
                        category = new Category_1.Category();
                        category.name = "people";
                        return [4 /*yield*/, categoryRepository.save(category)];
                    case 1:
                        _a.sent();
                        blog = new Blog_1.Blog();
                        blog.title = "About people";
                        blog.text = "Blog about good people";
                        blog.categories = [category];
                        return [4 /*yield*/, blogRepository.save(blog)];
                    case 2:
                        _a.sent();
                        plainBlogWithId = { id: 1 };
                        return [4 /*yield*/, blogRepository.preload(plainBlogWithId)];
                    case 3:
                        preloadedBlog = _a.sent();
                        preloadedBlog.should.be.instanceOf(Blog_1.Blog);
                        preloadedBlog.id.should.be.equal(1);
                        preloadedBlog.title.should.be.equal("About people");
                        preloadedBlog.text.should.be.equal("Blog about good people");
                        return [2 /*return*/];
                }
            });
        }); })); });
        it("should preload entity and all relations given in the object", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var blogRepository, categoryRepository, category, blog, plainBlogWithId, preloadedBlog;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        blogRepository = connection.getRepository(Blog_1.Blog);
                        categoryRepository = connection.getRepository(Category_1.Category);
                        category = new Category_1.Category();
                        category.name = "people";
                        return [4 /*yield*/, categoryRepository.save(category)];
                    case 1:
                        _a.sent();
                        blog = new Blog_1.Blog();
                        blog.title = "About people";
                        blog.text = "Blog about good people";
                        blog.categories = [category];
                        return [4 /*yield*/, blogRepository.save(blog)];
                    case 2:
                        _a.sent();
                        plainBlogWithId = { id: 1, categories: [{ id: 1 }] };
                        return [4 /*yield*/, blogRepository.preload(plainBlogWithId)];
                    case 3:
                        preloadedBlog = _a.sent();
                        preloadedBlog.should.be.instanceOf(Blog_1.Blog);
                        preloadedBlog.id.should.be.equal(1);
                        preloadedBlog.title.should.be.equal("About people");
                        preloadedBlog.text.should.be.equal("Blog about good people");
                        preloadedBlog.categories[0].id.should.be.equal(1);
                        preloadedBlog.categories[0].name.should.be.equal("people");
                        return [2 /*return*/];
                }
            });
        }); })); });
    });
    describe("merge", function () {
        var _this = this;
        it("should merge multiple entities", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var blogRepository, originalEntity, blog1, blog2, category, blog3, mergedBlog;
            return tslib_1.__generator(this, function (_a) {
                blogRepository = connection.getRepository(Blog_1.Blog);
                originalEntity = new Blog_1.Blog();
                blog1 = new Blog_1.Blog();
                blog1.title = "First Blog";
                blog2 = new Blog_1.Blog();
                blog2.text = "text is from second blog";
                category = new Category_1.Category();
                category.name = "category from third blog";
                blog3 = new Blog_1.Blog();
                blog3.categories = [category];
                mergedBlog = blogRepository.merge(originalEntity, blog1, blog2, blog3);
                mergedBlog.should.be.instanceOf(Blog_1.Blog);
                mergedBlog.should.be.equal(originalEntity);
                mergedBlog.should.not.be.equal(blog1);
                mergedBlog.should.not.be.equal(blog2);
                mergedBlog.should.not.be.equal(blog3);
                mergedBlog.title.should.be.equal("First Blog");
                mergedBlog.text.should.be.equal("text is from second blog");
                mergedBlog.categories[0].name.should.be.equal("category from third blog");
                return [2 /*return*/];
            });
        }); })); });
        it("should merge both entities and plain objects", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var blogRepository, originalEntity, blog1, blog2, blog3, mergedBlog;
            return tslib_1.__generator(this, function (_a) {
                blogRepository = connection.getRepository(Blog_1.Blog);
                originalEntity = new Blog_1.Blog();
                blog1 = { title: "First Blog" };
                blog2 = { text: "text is from second blog" };
                blog3 = new Blog_1.Blog();
                blog3.categories = [{ name: "category from third blog" }];
                mergedBlog = blogRepository.merge(originalEntity, blog1, blog2, blog3);
                mergedBlog.should.be.instanceOf(Blog_1.Blog);
                mergedBlog.should.be.equal(originalEntity);
                mergedBlog.should.not.be.equal(blog1);
                mergedBlog.should.not.be.equal(blog2);
                mergedBlog.should.not.be.equal(blog3);
                mergedBlog.title.should.be.equal("First Blog");
                mergedBlog.text.should.be.equal("text is from second blog");
                mergedBlog.categories[0].name.should.be.equal("category from third blog");
                return [2 /*return*/];
            });
        }); })); });
    });
    describe("save", function () {
        var _this = this;
        it("should update existing entity using transformers", function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var connection, post, date, postRepository, dbPost, saved;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        connection = connections.find(function (c) { return c.name === "sqlite"; });
                        if (!connection || connection.options.skip === true) {
                            return [2 /*return*/];
                        }
                        post = new Post_1.Post();
                        date = new Date("2018-01-01 01:00:00");
                        post.dateAdded = date;
                        post.title = "Post title";
                        post.id = 1;
                        postRepository = connection.getRepository(Post_1.Post);
                        return [4 /*yield*/, postRepository.save(post)];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, postRepository.findOne(post.id)];
                    case 2:
                        dbPost = _a.sent();
                        dbPost.should.be.instanceOf(Post_1.Post);
                        dbPost.dateAdded.should.be.instanceOf(Date);
                        dbPost.dateAdded.getTime().should.be.equal(date.getTime());
                        dbPost.title = "New title";
                        return [4 /*yield*/, postRepository.save(dbPost)];
                    case 3:
                        saved = _a.sent();
                        saved.should.be.instanceOf(Post_1.Post);
                        saved.id.should.be.equal(1);
                        saved.title.should.be.equal("New title");
                        saved.dateAdded.should.be.instanceof(Date);
                        saved.dateAdded.getTime().should.be.equal(date.getTime());
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe("preload also should also implement merge functionality", function () {
        var _this = this;
        it("if we preload entity from the plain object and merge preloaded object with plain object we'll have an object from the db with the replaced properties by a plain object's properties", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var blogRepository, categoryRepository, firstCategory, secondCategory, blog, plainBlogWithId, preloadedBlog;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        blogRepository = connection.getRepository(Blog_1.Blog);
                        categoryRepository = connection.getRepository(Category_1.Category);
                        firstCategory = new Category_1.Category();
                        firstCategory.name = "people";
                        return [4 /*yield*/, categoryRepository.save(firstCategory)];
                    case 1:
                        _a.sent();
                        secondCategory = new Category_1.Category();
                        secondCategory.name = "animals";
                        return [4 /*yield*/, categoryRepository.save(secondCategory)];
                    case 2:
                        _a.sent();
                        blog = new Blog_1.Blog();
                        blog.title = "About people";
                        blog.text = "Blog about good people";
                        blog.categories = [firstCategory, secondCategory];
                        return [4 /*yield*/, blogRepository.save(blog)];
                    case 3:
                        _a.sent();
                        plainBlogWithId = {
                            id: 1,
                            title: "changed title about people",
                            categories: [{ id: 1 }, { id: 2, name: "insects" }]
                        };
                        return [4 /*yield*/, blogRepository.preload(plainBlogWithId)];
                    case 4:
                        preloadedBlog = _a.sent();
                        preloadedBlog.should.be.instanceOf(Blog_1.Blog);
                        preloadedBlog.id.should.be.equal(1);
                        preloadedBlog.title.should.be.equal("changed title about people");
                        preloadedBlog.text.should.be.equal("Blog about good people");
                        preloadedBlog.categories[0].id.should.be.equal(1);
                        preloadedBlog.categories[0].name.should.be.equal("people");
                        preloadedBlog.categories[1].id.should.be.equal(2);
                        preloadedBlog.categories[1].name.should.be.equal("insects");
                        return [2 /*return*/];
                }
            });
        }); })); });
    });
    describe("query", function () {
        var _this = this;
        it("should execute the query natively and it should return the result", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var repository, promises, i, blog, query, result;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        repository = connection.getRepository(Blog_1.Blog);
                        promises = [];
                        for (i = 0; i < 5; i++) { // todo: should pass with 50 items. find the problem
                            blog = new Blog_1.Blog();
                            blog.title = "hello blog";
                            blog.text = "hello blog #" + i;
                            blog.counter = i * 100;
                            promises.push(repository.save(blog));
                        }
                        return [4 /*yield*/, Promise.all(promises)];
                    case 1:
                        _a.sent();
                        query = "SELECT MAX(" + connection.driver.escape("blog") + "." + connection.driver.escape("counter") + ") as " + connection.driver.escape("max") + " " +
                            (" FROM " + connection.driver.escape("blog") + " " + connection.driver.escape("blog"));
                        return [4 /*yield*/, repository.query(query)];
                    case 2:
                        result = _a.sent();
                        result[0].should.not.be.undefined;
                        result[0].max.should.not.be.undefined;
                        return [2 /*return*/];
                }
            });
        }); })); });
    });
    /*describe.skip("transaction", function() {

        it("executed queries must success", () => Promise.all(connections.map(async connection => {
            const repository = connection.getRepository(Blog);
            let blogs = await repository.find();
            blogs.should.be.eql([]);

            const blog = new Blog();
            blog.title = "hello blog title";
            blog.text = "hello blog text";
            await repository.save(blog);
            blogs.should.be.eql([]);

            blogs = await repository.find();
            blogs.length.should.be.equal(1);

            await repository.transaction(async () => {
                const promises: Promise<Blog>[] = [];
                for (let i = 0; i < 100; i++) {
                    const blog = new Blog();
                    blog.title = "hello blog";
                    blog.text = "hello blog #" + i;
                    blog.counter = i * 100;
                    promises.push(repository.save(blog));
                }
                await Promise.all(promises);

                blogs = await repository.find();
                blogs.length.should.be.equal(101);
            });

            blogs = await repository.find();
            blogs.length.should.be.equal(101);
        })));

        it("executed queries must rollback in the case if error in transaction", () => Promise.all(connections.map(async connection => {
            const repository = connection.getRepository(Blog);
            let blogs = await repository.find();
            blogs.should.be.eql([]);

            const blog = new Blog();
            blog.title = "hello blog title";
            blog.text = "hello blog text";
            await repository.save(blog);
            blogs.should.be.eql([]);

            blogs = await repository.find();
            blogs.length.should.be.equal(1);

            await repository.transaction(async () => {
                const promises: Promise<Blog>[] = [];
                for (let i = 0; i < 100; i++) {
                    const blog = new Blog();
                    blog.title = "hello blog";
                    blog.text = "hello blog #" + i;
                    blog.counter = i * 100;
                    promises.push(repository.save(blog));
                }
                await Promise.all(promises);

                blogs = await repository.find();
                blogs.length.should.be.equal(101);

                // now send the query that will crash all for us
                throw new Error("this error will cancel all persist operations");
            }).should.be.rejected;

            blogs = await repository.find();
            blogs.length.should.be.equal(1);
        })));

    });*/
});
//# sourceMappingURL=repository-basic-methods.js.map