"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var chai_1 = require("chai");
var Post_1 = require("./entity/Post");
var Category_1 = require("./entity/Category");
var test_utils_1 = require("../../../utils/test-utils");
// todo: fix this test later
describe.skip("repository > set/add/remove relation methods", function () {
    // -------------------------------------------------------------------------
    // Configuration
    // -------------------------------------------------------------------------
    var _this = this;
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
    // -------------------------------------------------------------------------
    // Specifications
    // -------------------------------------------------------------------------
    it("add elements to many-to-many from owner side", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var postRepository, categoryRepository, newCategory1, newCategory2, newPost, loadedPost;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    postRepository = connection.getRepository(Post_1.Post);
                    categoryRepository = connection.getRepository(Category_1.Category);
                    newCategory1 = categoryRepository.create();
                    newCategory1.name = "Animals";
                    return [4 /*yield*/, categoryRepository.save(newCategory1)];
                case 1:
                    _a.sent();
                    newCategory2 = categoryRepository.create();
                    newCategory2.name = "Kids";
                    return [4 /*yield*/, categoryRepository.save(newCategory2)];
                case 2:
                    _a.sent();
                    newPost = postRepository.create();
                    newPost.title = "Super post";
                    return [4 /*yield*/, postRepository.save(newPost)];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, postRepository.findOne(1, {
                            join: {
                                alias: "post",
                                leftJoinAndSelect: {
                                    manyCategories: "post.manyCategories"
                                }
                            }
                        })];
                case 4:
                    loadedPost = _a.sent();
                    chai_1.expect(loadedPost).not.to.be.undefined;
                    chai_1.expect(loadedPost.manyCategories).not.to.be.undefined;
                    chai_1.expect(loadedPost.manyCategories[0]).not.to.be.undefined;
                    chai_1.expect(loadedPost.manyCategories[1]).not.to.be.undefined;
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("add elements to many-to-many from inverse side", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var postRepository, categoryRepository, newPost1, newPost2, newCategory, loadedCategory;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    postRepository = connection.getRepository(Post_1.Post);
                    categoryRepository = connection.getRepository(Category_1.Category);
                    newPost1 = postRepository.create();
                    newPost1.title = "post #1";
                    return [4 /*yield*/, postRepository.save(newPost1)];
                case 1:
                    _a.sent();
                    newPost2 = postRepository.create();
                    newPost2.title = "post #2";
                    return [4 /*yield*/, postRepository.save(newPost2)];
                case 2:
                    _a.sent();
                    newCategory = categoryRepository.create();
                    newCategory.name = "Kids";
                    return [4 /*yield*/, categoryRepository.save(newCategory)];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, categoryRepository.findOne(1, {
                            join: {
                                alias: "category",
                                leftJoinAndSelect: { manyPosts: "category.manyPosts" }
                            }
                        })];
                case 4:
                    loadedCategory = _a.sent();
                    chai_1.expect(loadedCategory).not.to.be.undefined;
                    chai_1.expect(loadedCategory.manyPosts).not.to.be.undefined;
                    chai_1.expect(loadedCategory.manyPosts[0]).not.to.be.undefined;
                    chai_1.expect(loadedCategory.manyPosts[1]).not.to.be.undefined;
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("remove elements to many-to-many from owner side", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var postRepository, categoryRepository, newCategory1, newCategory2, newCategory3, newPost, loadedPost;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    postRepository = connection.getRepository(Post_1.Post);
                    categoryRepository = connection.getRepository(Category_1.Category);
                    newCategory1 = categoryRepository.create();
                    newCategory1.name = "Animals";
                    return [4 /*yield*/, categoryRepository.save(newCategory1)];
                case 1:
                    _a.sent();
                    newCategory2 = categoryRepository.create();
                    newCategory2.name = "Kids";
                    return [4 /*yield*/, categoryRepository.save(newCategory2)];
                case 2:
                    _a.sent();
                    newCategory3 = categoryRepository.create();
                    newCategory3.name = "Adults";
                    return [4 /*yield*/, categoryRepository.save(newCategory3)];
                case 3:
                    _a.sent();
                    newPost = postRepository.create();
                    newPost.title = "Super post";
                    newPost.manyCategories = [newCategory1, newCategory2, newCategory3];
                    return [4 /*yield*/, postRepository.save(newPost)];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, postRepository.findOne(1, {
                            join: {
                                alias: "post",
                                leftJoinAndSelect: { manyCategories: "post.manyCategories" }
                            }
                        })];
                case 5:
                    loadedPost = _a.sent();
                    chai_1.expect(loadedPost).not.to.be.undefined;
                    chai_1.expect(loadedPost.manyCategories).not.to.be.undefined;
                    loadedPost.manyCategories.length.should.be.equal(1);
                    loadedPost.manyCategories[0].name.should.be.equal("Kids");
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("remove elements to many-to-many from inverse side", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var postRepository, categoryRepository, newPost1, newPost2, newPost3, newCategory, loadedCategory;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    postRepository = connection.getRepository(Post_1.Post);
                    categoryRepository = connection.getRepository(Category_1.Category);
                    newPost1 = postRepository.create();
                    newPost1.title = "post #1";
                    return [4 /*yield*/, postRepository.save(newPost1)];
                case 1:
                    _a.sent();
                    newPost2 = postRepository.create();
                    newPost2.title = "post #2";
                    return [4 /*yield*/, postRepository.save(newPost2)];
                case 2:
                    _a.sent();
                    newPost3 = postRepository.create();
                    newPost3.title = "post #3";
                    return [4 /*yield*/, postRepository.save(newPost3)];
                case 3:
                    _a.sent();
                    newCategory = categoryRepository.create();
                    newCategory.name = "SuperCategory";
                    newCategory.manyPosts = [newPost1, newPost2, newPost3];
                    return [4 /*yield*/, categoryRepository.save(newCategory)];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, categoryRepository.findOne(1, {
                            join: {
                                alias: "category",
                                leftJoinAndSelect: { manyPosts: "category.manyPosts" }
                            }
                        })];
                case 5:
                    loadedCategory = _a.sent();
                    chai_1.expect(loadedCategory).not.to.be.undefined;
                    chai_1.expect(loadedCategory.manyPosts).not.to.be.undefined;
                    loadedCategory.manyPosts.length.should.be.equal(1);
                    loadedCategory.manyPosts[0].title.should.be.equal("post #2");
                    return [2 /*return*/];
            }
        });
    }); })); });
    // todo: fix this test later
    it("set element to one-to-many relation", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var postRepository, categoryRepository, newCategory1, newPost, loadedPost;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    postRepository = connection.getRepository(Post_1.Post);
                    categoryRepository = connection.getRepository(Category_1.Category);
                    newCategory1 = categoryRepository.create();
                    newCategory1.name = "Animals";
                    return [4 /*yield*/, categoryRepository.save(newCategory1)];
                case 1:
                    _a.sent();
                    newPost = postRepository.create();
                    newPost.title = "Super post";
                    return [4 /*yield*/, postRepository.save(newPost)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, postRepository.findOne(1, {
                            join: {
                                alias: "post",
                                leftJoinAndSelect: { categories: "post.categories" }
                            }
                        })];
                case 3:
                    loadedPost = _a.sent();
                    chai_1.expect(loadedPost).not.to.be.undefined;
                    chai_1.expect(loadedPost.categories).not.to.be.undefined;
                    chai_1.expect(loadedPost.categories[0]).not.to.be.undefined;
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("set element to many-to-one relation", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var postRepository, categoryRepository, newPost, newCategory, loadedCategory;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    postRepository = connection.getRepository(Post_1.Post);
                    categoryRepository = connection.getRepository(Category_1.Category);
                    newPost = postRepository.create();
                    newPost.title = "post #1";
                    return [4 /*yield*/, postRepository.save(newPost)];
                case 1:
                    _a.sent();
                    newCategory = categoryRepository.create();
                    newCategory.name = "Kids";
                    return [4 /*yield*/, categoryRepository.save(newCategory)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, categoryRepository.findOne(1, {
                            join: {
                                alias: "category",
                                leftJoinAndSelect: { post: "category.post" }
                            }
                        })];
                case 3:
                    loadedCategory = _a.sent();
                    chai_1.expect(loadedCategory).not.to.be.undefined;
                    chai_1.expect(loadedCategory.post).not.to.be.undefined;
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("set element to NULL in one-to-many relation", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var postRepository, categoryRepository, newCategory1, newPost, loadedPost;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    postRepository = connection.getRepository(Post_1.Post);
                    categoryRepository = connection.getRepository(Category_1.Category);
                    newCategory1 = categoryRepository.create();
                    newCategory1.name = "Animals";
                    return [4 /*yield*/, categoryRepository.save(newCategory1)];
                case 1:
                    _a.sent();
                    newPost = postRepository.create();
                    newPost.title = "Super post";
                    newPost.categories = [newCategory1];
                    return [4 /*yield*/, postRepository.save(newPost)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, postRepository.findOne(1, {
                            join: {
                                alias: "post",
                                leftJoinAndSelect: { categories: "post.categories" }
                            }
                        })];
                case 3:
                    loadedPost = _a.sent();
                    chai_1.expect(loadedPost).not.to.be.undefined;
                    chai_1.expect(loadedPost.categories).to.be.eql([]);
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("set element to NULL in many-to-one relation", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var postRepository, categoryRepository, newPost, newCategory, loadedCategory;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    postRepository = connection.getRepository(Post_1.Post);
                    categoryRepository = connection.getRepository(Category_1.Category);
                    newPost = postRepository.create();
                    newPost.title = "post #1";
                    return [4 /*yield*/, postRepository.save(newPost)];
                case 1:
                    _a.sent();
                    newCategory = categoryRepository.create();
                    newCategory.name = "Kids";
                    newCategory.post = newPost;
                    return [4 /*yield*/, categoryRepository.save(newCategory)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, categoryRepository.findOne(1, {
                            join: {
                                alias: "category",
                                leftJoinAndSelect: { post: "category.post" }
                            }
                        })];
                case 3:
                    loadedCategory = _a.sent();
                    chai_1.expect(loadedCategory).not.to.be.undefined;
                    chai_1.expect(loadedCategory.post).to.be.undefined;
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=repository-set-add-remove-relations.js.map