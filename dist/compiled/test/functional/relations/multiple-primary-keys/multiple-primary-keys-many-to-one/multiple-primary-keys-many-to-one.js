"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var chai_1 = require("chai");
var test_utils_1 = require("../../../../utils/test-utils");
var Post_1 = require("./entity/Post");
var Category_1 = require("./entity/Category");
describe("relations > multiple-primary-keys > many-to-one", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                    })];
                case 1: return [2 /*return*/, connections = _a.sent()];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    describe("owning side", function () {
        it("should load related entity when JoinColumn is not specified", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var category1, category2, post1, post2, loadedPosts, loadedPost;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        category1 = new Category_1.Category();
                        category1.name = "cars";
                        category1.type = "common-category";
                        category1.code = 1;
                        category1.version = 1;
                        return [4 /*yield*/, connection.manager.save(category1)];
                    case 1:
                        _a.sent();
                        category2 = new Category_1.Category();
                        category2.name = "airplanes";
                        category2.type = "common-category";
                        category2.code = 2;
                        category2.version = 1;
                        return [4 /*yield*/, connection.manager.save(category2)];
                    case 2:
                        _a.sent();
                        post1 = new Post_1.Post();
                        post1.title = "About BMW";
                        post1.category = category1;
                        return [4 /*yield*/, connection.manager.save(post1)];
                    case 3:
                        _a.sent();
                        post2 = new Post_1.Post();
                        post2.title = "About Boeing";
                        post2.category = category2;
                        return [4 /*yield*/, connection.manager.save(post2)];
                    case 4:
                        _a.sent();
                        return [4 /*yield*/, connection.manager
                                .createQueryBuilder(Post_1.Post, "post")
                                .leftJoinAndSelect("post.category", "category")
                                .orderBy("post.id")
                                .getMany()];
                    case 5:
                        loadedPosts = _a.sent();
                        chai_1.expect(loadedPosts[0].category).to.not.be.undefined;
                        chai_1.expect(loadedPosts[0].category.name).to.be.equal("cars");
                        chai_1.expect(loadedPosts[0].category.type).to.be.equal("common-category");
                        chai_1.expect(loadedPosts[1].category).to.not.be.undefined;
                        chai_1.expect(loadedPosts[1].category.name).to.be.equal("airplanes");
                        chai_1.expect(loadedPosts[1].category.type).to.be.equal("common-category");
                        return [4 /*yield*/, connection.manager
                                .createQueryBuilder(Post_1.Post, "post")
                                .leftJoinAndSelect("post.category", "category")
                                .where("post.id = :id", { id: 1 })
                                .getOne()];
                    case 6:
                        loadedPost = _a.sent();
                        chai_1.expect(loadedPost.category).to.not.be.undefined;
                        chai_1.expect(loadedPost.category.name).to.be.equal("cars");
                        chai_1.expect(loadedPost.category.type).to.be.equal("common-category");
                        return [2 /*return*/];
                }
            });
        }); })); });
        it("should load related entity when JoinColumn is specified without options", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var category1, category2, post1, post2, loadedPosts, loadedPost;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        category1 = new Category_1.Category();
                        category1.name = "cars";
                        category1.type = "common-category";
                        category1.code = 1;
                        category1.version = 1;
                        return [4 /*yield*/, connection.manager.save(category1)];
                    case 1:
                        _a.sent();
                        category2 = new Category_1.Category();
                        category2.name = "airplanes";
                        category2.type = "common-category";
                        category2.code = 2;
                        category2.version = 1;
                        return [4 /*yield*/, connection.manager.save(category2)];
                    case 2:
                        _a.sent();
                        post1 = new Post_1.Post();
                        post1.title = "About BMW";
                        post1.categoryWithJoinColumn = category1;
                        return [4 /*yield*/, connection.manager.save(post1)];
                    case 3:
                        _a.sent();
                        post2 = new Post_1.Post();
                        post2.title = "About Boeing";
                        post2.categoryWithJoinColumn = category2;
                        return [4 /*yield*/, connection.manager.save(post2)];
                    case 4:
                        _a.sent();
                        return [4 /*yield*/, connection.manager
                                .createQueryBuilder(Post_1.Post, "post")
                                .leftJoinAndSelect("post.categoryWithJoinColumn", "category")
                                .orderBy("post.id")
                                .getMany()];
                    case 5:
                        loadedPosts = _a.sent();
                        chai_1.expect(loadedPosts[0].categoryWithJoinColumn).to.not.be.undefined;
                        chai_1.expect(loadedPosts[0].categoryWithJoinColumn.name).to.be.equal("cars");
                        chai_1.expect(loadedPosts[0].categoryWithJoinColumn.type).to.be.equal("common-category");
                        chai_1.expect(loadedPosts[1].categoryWithJoinColumn).to.not.be.undefined;
                        chai_1.expect(loadedPosts[1].categoryWithJoinColumn.name).to.be.equal("airplanes");
                        chai_1.expect(loadedPosts[1].categoryWithJoinColumn.type).to.be.equal("common-category");
                        return [4 /*yield*/, connection.manager
                                .createQueryBuilder(Post_1.Post, "post")
                                .leftJoinAndSelect("post.categoryWithJoinColumn", "category")
                                .where("post.id = :id", { id: 1 })
                                .getOne()];
                    case 6:
                        loadedPost = _a.sent();
                        chai_1.expect(loadedPost.categoryWithJoinColumn).to.not.be.undefined;
                        chai_1.expect(loadedPost.categoryWithJoinColumn.name).to.be.equal("cars");
                        chai_1.expect(loadedPost.categoryWithJoinColumn.type).to.be.equal("common-category");
                        return [2 /*return*/];
                }
            });
        }); })); });
        it("should load related entity when JoinColumn is specified with options", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var category1, category2, post1, post2, loadedPosts, loadedPost;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        category1 = new Category_1.Category();
                        category1.name = "cars";
                        category1.type = "common-category";
                        category1.code = 1;
                        category1.version = 1;
                        return [4 /*yield*/, connection.manager.save(category1)];
                    case 1:
                        _a.sent();
                        category2 = new Category_1.Category();
                        category2.name = "airplanes";
                        category2.type = "common-category";
                        category2.code = 2;
                        category2.version = 1;
                        return [4 /*yield*/, connection.manager.save(category2)];
                    case 2:
                        _a.sent();
                        post1 = new Post_1.Post();
                        post1.title = "About BMW";
                        post1.categoryWithOptions = category1;
                        return [4 /*yield*/, connection.manager.save(post1)];
                    case 3:
                        _a.sent();
                        post2 = new Post_1.Post();
                        post2.title = "About Boeing";
                        post2.categoryWithOptions = category2;
                        return [4 /*yield*/, connection.manager.save(post2)];
                    case 4:
                        _a.sent();
                        return [4 /*yield*/, connection.manager
                                .createQueryBuilder(Post_1.Post, "post")
                                .leftJoinAndSelect("post.categoryWithOptions", "category")
                                .orderBy("post.id")
                                .getMany()];
                    case 5:
                        loadedPosts = _a.sent();
                        chai_1.expect(loadedPosts[0].categoryWithOptions).to.not.be.eql([]);
                        chai_1.expect(loadedPosts[0].categoryWithOptions.name).to.be.equal("cars");
                        chai_1.expect(loadedPosts[0].categoryWithOptions.type).to.be.equal("common-category");
                        chai_1.expect(loadedPosts[1].categoryWithOptions).to.not.be.eql([]);
                        chai_1.expect(loadedPosts[1].categoryWithOptions.name).to.be.equal("airplanes");
                        chai_1.expect(loadedPosts[1].categoryWithOptions.type).to.be.equal("common-category");
                        return [4 /*yield*/, connection.manager
                                .createQueryBuilder(Post_1.Post, "post")
                                .leftJoinAndSelect("post.categoryWithOptions", "category")
                                .where("post.id = :id", { id: 1 })
                                .getOne()];
                    case 6:
                        loadedPost = _a.sent();
                        chai_1.expect(loadedPost.categoryWithOptions).to.not.be.eql([]);
                        chai_1.expect(loadedPost.categoryWithOptions.name).to.be.equal("cars");
                        chai_1.expect(loadedPost.categoryWithOptions.type).to.be.equal("common-category");
                        return [2 /*return*/];
                }
            });
        }); })); });
        it("should load related entity when JoinColumn references on to non-primary columns", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var category1, category2, post1, post2, loadedPosts, loadedPost;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        category1 = new Category_1.Category();
                        category1.name = "cars";
                        category1.type = "common-category";
                        category1.code = 1;
                        category1.version = 1;
                        category1.description = "category about cars";
                        return [4 /*yield*/, connection.manager.save(category1)];
                    case 1:
                        _a.sent();
                        category2 = new Category_1.Category();
                        category2.name = "airplanes";
                        category2.type = "common-category";
                        category2.code = 2;
                        category2.version = 1;
                        category2.description = "category about airplanes";
                        return [4 /*yield*/, connection.manager.save(category2)];
                    case 2:
                        _a.sent();
                        post1 = new Post_1.Post();
                        post1.title = "About BMW";
                        post1.categoryWithNonPKColumns = category1;
                        return [4 /*yield*/, connection.manager.save(post1)];
                    case 3:
                        _a.sent();
                        post2 = new Post_1.Post();
                        post2.title = "About Boeing";
                        post2.categoryWithNonPKColumns = category2;
                        return [4 /*yield*/, connection.manager.save(post2)];
                    case 4:
                        _a.sent();
                        return [4 /*yield*/, connection.manager
                                .createQueryBuilder(Post_1.Post, "post")
                                .leftJoinAndSelect("post.categoryWithNonPKColumns", "category")
                                .orderBy("post.id")
                                .getMany()];
                    case 5:
                        loadedPosts = _a.sent();
                        chai_1.expect(loadedPosts[0].categoryWithNonPKColumns).to.not.be.eql([]);
                        chai_1.expect(loadedPosts[0].categoryWithNonPKColumns.code).to.be.equal(1);
                        chai_1.expect(loadedPosts[0].categoryWithNonPKColumns.version).to.be.equal(1);
                        chai_1.expect(loadedPosts[0].categoryWithNonPKColumns.description).to.be.equal("category about cars");
                        chai_1.expect(loadedPosts[1].categoryWithNonPKColumns).to.not.be.eql([]);
                        chai_1.expect(loadedPosts[1].categoryWithNonPKColumns.code).to.be.equal(2);
                        chai_1.expect(loadedPosts[1].categoryWithNonPKColumns.version).to.be.equal(1);
                        return [4 /*yield*/, connection.manager
                                .createQueryBuilder(Post_1.Post, "post")
                                .leftJoinAndSelect("post.categoryWithNonPKColumns", "category")
                                .where("post.id = :id", { id: 1 })
                                .getOne()];
                    case 6:
                        loadedPost = _a.sent();
                        chai_1.expect(loadedPost.categoryWithNonPKColumns).to.not.be.eql([]);
                        chai_1.expect(loadedPost.categoryWithNonPKColumns.code).to.be.equal(1);
                        chai_1.expect(loadedPost.categoryWithNonPKColumns.version).to.be.equal(1);
                        chai_1.expect(loadedPost.categoryWithNonPKColumns.description).to.be.equal("category about cars");
                        return [2 /*return*/];
                }
            });
        }); })); });
    });
    describe("inverse side", function () {
        it("should load related entity when JoinColumn is not specified", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var post1, post2, post3, category1, category2, loadedCategories, loadedCategory;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        post1 = new Post_1.Post();
                        post1.title = "About BMW";
                        return [4 /*yield*/, connection.manager.save(post1)];
                    case 1:
                        _a.sent();
                        post2 = new Post_1.Post();
                        post2.title = "About Audi";
                        return [4 /*yield*/, connection.manager.save(post2)];
                    case 2:
                        _a.sent();
                        post3 = new Post_1.Post();
                        post3.title = "About Boeing";
                        return [4 /*yield*/, connection.manager.save(post3)];
                    case 3:
                        _a.sent();
                        category1 = new Category_1.Category();
                        category1.name = "cars";
                        category1.type = "common-category";
                        category1.code = 1;
                        category1.version = 1;
                        category1.posts = [post1, post2];
                        return [4 /*yield*/, connection.manager.save(category1)];
                    case 4:
                        _a.sent();
                        category2 = new Category_1.Category();
                        category2.name = "airplanes";
                        category2.type = "common-category";
                        category2.code = 2;
                        category2.version = 1;
                        category2.posts = [post3];
                        return [4 /*yield*/, connection.manager.save(category2)];
                    case 5:
                        _a.sent();
                        return [4 /*yield*/, connection.manager
                                .createQueryBuilder(Category_1.Category, "category")
                                .leftJoinAndSelect("category.posts", "posts")
                                .orderBy("category.code, posts.id")
                                .getMany()];
                    case 6:
                        loadedCategories = _a.sent();
                        chai_1.expect(loadedCategories[0].posts).to.not.be.eql([]);
                        chai_1.expect(loadedCategories[0].posts[0].id).to.be.equal(1);
                        chai_1.expect(loadedCategories[0].posts[0].title).to.be.equal("About BMW");
                        chai_1.expect(loadedCategories[0].posts[1].id).to.be.equal(2);
                        chai_1.expect(loadedCategories[0].posts[1].title).to.be.equal("About Audi");
                        chai_1.expect(loadedCategories[1].posts).to.not.be.eql([]);
                        chai_1.expect(loadedCategories[1].posts[0].id).to.be.equal(3);
                        chai_1.expect(loadedCategories[1].posts[0].title).to.be.equal("About Boeing");
                        return [4 /*yield*/, connection.manager
                                .createQueryBuilder(Category_1.Category, "category")
                                .leftJoinAndSelect("category.posts", "posts")
                                .orderBy("posts.id")
                                .where("category.code = :code", { code: 1 })
                                .getOne()];
                    case 7:
                        loadedCategory = _a.sent();
                        chai_1.expect(loadedCategory.posts).to.not.be.eql([]);
                        chai_1.expect(loadedCategory.posts[0].id).to.be.equal(1);
                        chai_1.expect(loadedCategory.posts[0].title).to.be.equal("About BMW");
                        chai_1.expect(loadedCategory.posts[1].id).to.be.equal(2);
                        chai_1.expect(loadedCategory.posts[1].title).to.be.equal("About Audi");
                        return [2 /*return*/];
                }
            });
        }); })); });
        it("should load related entity when JoinColumn is specified without options", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var post1, post2, post3, category1, category2, loadedCategories, loadedCategory;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        post1 = new Post_1.Post();
                        post1.title = "About BMW";
                        return [4 /*yield*/, connection.manager.save(post1)];
                    case 1:
                        _a.sent();
                        post2 = new Post_1.Post();
                        post2.title = "About Audi";
                        return [4 /*yield*/, connection.manager.save(post2)];
                    case 2:
                        _a.sent();
                        post3 = new Post_1.Post();
                        post3.title = "About Boeing";
                        return [4 /*yield*/, connection.manager.save(post3)];
                    case 3:
                        _a.sent();
                        category1 = new Category_1.Category();
                        category1.name = "cars";
                        category1.type = "common-category";
                        category1.code = 1;
                        category1.version = 1;
                        category1.postsWithJoinColumn = [post1, post2];
                        return [4 /*yield*/, connection.manager.save(category1)];
                    case 4:
                        _a.sent();
                        category2 = new Category_1.Category();
                        category2.name = "airplanes";
                        category2.type = "common-category";
                        category2.code = 2;
                        category2.version = 1;
                        category2.postsWithJoinColumn = [post3];
                        return [4 /*yield*/, connection.manager.save(category2)];
                    case 5:
                        _a.sent();
                        return [4 /*yield*/, connection.manager
                                .createQueryBuilder(Category_1.Category, "category")
                                .leftJoinAndSelect("category.postsWithJoinColumn", "posts")
                                .orderBy("category.code, posts.id")
                                .getMany()];
                    case 6:
                        loadedCategories = _a.sent();
                        chai_1.expect(loadedCategories[0].postsWithJoinColumn).to.not.be.undefined;
                        chai_1.expect(loadedCategories[0].postsWithJoinColumn[0].id).to.be.equal(1);
                        chai_1.expect(loadedCategories[0].postsWithJoinColumn[0].title).to.be.equal("About BMW");
                        chai_1.expect(loadedCategories[0].postsWithJoinColumn[1].id).to.be.equal(2);
                        chai_1.expect(loadedCategories[0].postsWithJoinColumn[1].title).to.be.equal("About Audi");
                        chai_1.expect(loadedCategories[1].postsWithJoinColumn).to.not.be.undefined;
                        chai_1.expect(loadedCategories[1].postsWithJoinColumn[0].id).to.be.equal(3);
                        chai_1.expect(loadedCategories[1].postsWithJoinColumn[0].title).to.be.equal("About Boeing");
                        return [4 /*yield*/, connection.manager
                                .createQueryBuilder(Category_1.Category, "category")
                                .leftJoinAndSelect("category.postsWithJoinColumn", "posts")
                                .orderBy("posts.id")
                                .where("category.code = :code", { code: 1 })
                                .getOne()];
                    case 7:
                        loadedCategory = _a.sent();
                        chai_1.expect(loadedCategory.postsWithJoinColumn).to.not.be.undefined;
                        chai_1.expect(loadedCategory.postsWithJoinColumn[0].id).to.be.equal(1);
                        chai_1.expect(loadedCategory.postsWithJoinColumn[0].title).to.be.equal("About BMW");
                        chai_1.expect(loadedCategory.postsWithJoinColumn[1].id).to.be.equal(2);
                        chai_1.expect(loadedCategory.postsWithJoinColumn[1].title).to.be.equal("About Audi");
                        return [2 /*return*/];
                }
            });
        }); })); });
        it("should load related entity when JoinColumn is specified with options", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var post1, post2, post3, category1, category2, loadedCategories, loadedCategory;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        post1 = new Post_1.Post();
                        post1.title = "About BMW";
                        return [4 /*yield*/, connection.manager.save(post1)];
                    case 1:
                        _a.sent();
                        post2 = new Post_1.Post();
                        post2.title = "About Audi";
                        return [4 /*yield*/, connection.manager.save(post2)];
                    case 2:
                        _a.sent();
                        post3 = new Post_1.Post();
                        post3.title = "About Boeing";
                        return [4 /*yield*/, connection.manager.save(post3)];
                    case 3:
                        _a.sent();
                        category1 = new Category_1.Category();
                        category1.name = "cars";
                        category1.type = "common-category";
                        category1.code = 1;
                        category1.version = 1;
                        category1.postsWithOptions = [post1, post2];
                        return [4 /*yield*/, connection.manager.save(category1)];
                    case 4:
                        _a.sent();
                        category2 = new Category_1.Category();
                        category2.name = "airplanes";
                        category2.type = "common-category";
                        category2.code = 2;
                        category2.version = 1;
                        category2.postsWithOptions = [post3];
                        return [4 /*yield*/, connection.manager.save(category2)];
                    case 5:
                        _a.sent();
                        return [4 /*yield*/, connection.manager
                                .createQueryBuilder(Category_1.Category, "category")
                                .leftJoinAndSelect("category.postsWithOptions", "posts")
                                .orderBy("category.code, posts.id")
                                .getMany()];
                    case 6:
                        loadedCategories = _a.sent();
                        chai_1.expect(loadedCategories[0].postsWithOptions).to.not.be.eql([]);
                        chai_1.expect(loadedCategories[0].postsWithOptions[0].id).to.be.equal(1);
                        chai_1.expect(loadedCategories[0].postsWithOptions[0].title).to.be.equal("About BMW");
                        chai_1.expect(loadedCategories[0].postsWithOptions[1].id).to.be.equal(2);
                        chai_1.expect(loadedCategories[0].postsWithOptions[1].title).to.be.equal("About Audi");
                        chai_1.expect(loadedCategories[1].postsWithOptions).to.not.be.eql([]);
                        chai_1.expect(loadedCategories[1].postsWithOptions[0].id).to.be.equal(3);
                        chai_1.expect(loadedCategories[1].postsWithOptions[0].title).to.be.equal("About Boeing");
                        return [4 /*yield*/, connection.manager
                                .createQueryBuilder(Category_1.Category, "category")
                                .leftJoinAndSelect("category.postsWithOptions", "posts")
                                .orderBy("posts.id")
                                .where("category.code = :code", { code: 1 })
                                .getOne()];
                    case 7:
                        loadedCategory = _a.sent();
                        chai_1.expect(loadedCategory.postsWithOptions).to.not.be.eql([]);
                        chai_1.expect(loadedCategory.postsWithOptions[0].id).to.be.equal(1);
                        chai_1.expect(loadedCategory.postsWithOptions[0].title).to.be.equal("About BMW");
                        chai_1.expect(loadedCategory.postsWithOptions[1].id).to.be.equal(2);
                        chai_1.expect(loadedCategory.postsWithOptions[1].title).to.be.equal("About Audi");
                        return [2 /*return*/];
                }
            });
        }); })); });
        it("should load related entity when JoinColumn references on to non-primary columns", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var post1, post2, post3, category1, category2, loadedCategories, loadedCategory;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        post1 = new Post_1.Post();
                        post1.title = "About BMW";
                        return [4 /*yield*/, connection.manager.save(post1)];
                    case 1:
                        _a.sent();
                        post2 = new Post_1.Post();
                        post2.title = "About Audi";
                        return [4 /*yield*/, connection.manager.save(post2)];
                    case 2:
                        _a.sent();
                        post3 = new Post_1.Post();
                        post3.title = "About Boeing";
                        return [4 /*yield*/, connection.manager.save(post3)];
                    case 3:
                        _a.sent();
                        category1 = new Category_1.Category();
                        category1.name = "cars";
                        category1.type = "common-category";
                        category1.code = 1;
                        category1.version = 1;
                        category1.description = "category of cars";
                        category1.postsWithNonPKColumns = [post1, post2];
                        return [4 /*yield*/, connection.manager.save(category1)];
                    case 4:
                        _a.sent();
                        category2 = new Category_1.Category();
                        category2.name = "airplanes";
                        category2.type = "common-category";
                        category2.code = 2;
                        category2.version = 1;
                        category2.description = "category of airplanes";
                        category2.postsWithNonPKColumns = [post3];
                        return [4 /*yield*/, connection.manager.save(category2)];
                    case 5:
                        _a.sent();
                        return [4 /*yield*/, connection.manager
                                .createQueryBuilder(Category_1.Category, "category")
                                .leftJoinAndSelect("category.postsWithNonPKColumns", "posts")
                                .orderBy("category.code, posts.id")
                                .getMany()];
                    case 6:
                        loadedCategories = _a.sent();
                        chai_1.expect(loadedCategories[0].postsWithNonPKColumns).to.not.be.eql([]);
                        chai_1.expect(loadedCategories[0].postsWithNonPKColumns[0].id).to.be.equal(1);
                        chai_1.expect(loadedCategories[0].postsWithNonPKColumns[0].title).to.be.equal("About BMW");
                        chai_1.expect(loadedCategories[0].postsWithNonPKColumns[1].id).to.be.equal(2);
                        chai_1.expect(loadedCategories[0].postsWithNonPKColumns[1].title).to.be.equal("About Audi");
                        chai_1.expect(loadedCategories[1].postsWithNonPKColumns).to.not.be.eql([]);
                        chai_1.expect(loadedCategories[1].postsWithNonPKColumns[0].id).to.be.equal(3);
                        chai_1.expect(loadedCategories[1].postsWithNonPKColumns[0].title).to.be.equal("About Boeing");
                        return [4 /*yield*/, connection.manager
                                .createQueryBuilder(Category_1.Category, "category")
                                .leftJoinAndSelect("category.postsWithNonPKColumns", "posts")
                                .orderBy("posts.id")
                                .where("category.code = :code", { code: 1 })
                                .getOne()];
                    case 7:
                        loadedCategory = _a.sent();
                        chai_1.expect(loadedCategory.postsWithNonPKColumns).to.not.be.eql([]);
                        chai_1.expect(loadedCategory.postsWithNonPKColumns[0].id).to.be.equal(1);
                        chai_1.expect(loadedCategory.postsWithNonPKColumns[0].title).to.be.equal("About BMW");
                        chai_1.expect(loadedCategory.postsWithNonPKColumns[1].id).to.be.equal(2);
                        chai_1.expect(loadedCategory.postsWithNonPKColumns[1].title).to.be.equal("About Audi");
                        return [2 /*return*/];
                }
            });
        }); })); });
    });
});
//# sourceMappingURL=multiple-primary-keys-many-to-one.js.map