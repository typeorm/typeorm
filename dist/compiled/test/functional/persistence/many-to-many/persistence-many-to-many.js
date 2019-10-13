"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var chai_1 = require("chai");
var Post_1 = require("./entity/Post");
var Category_1 = require("./entity/Category");
var User_1 = require("./entity/User");
var test_utils_1 = require("../../../utils/test-utils");
describe("persistence > many-to-many", function () {
    // -------------------------------------------------------------------------
    // Configuration
    // -------------------------------------------------------------------------
    var _this = this;
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () { return tslib_1.__generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({ __dirname: __dirname })];
            case 1: return [2 /*return*/, connections = _a.sent()];
        }
    }); }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    // -------------------------------------------------------------------------
    // Specifications
    // -------------------------------------------------------------------------
    it("add exist element to exist object with empty many-to-many relation and save it and it should contain a new category", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var postRepository, categoryRepository, userRepository, newCategory, newPost, newUser, loadedUser;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    postRepository = connection.getRepository(Post_1.Post);
                    categoryRepository = connection.getRepository(Category_1.Category);
                    userRepository = connection.getRepository(User_1.User);
                    newCategory = categoryRepository.create();
                    newCategory.name = "Animals";
                    return [4 /*yield*/, categoryRepository.save(newCategory)];
                case 1:
                    _a.sent();
                    newPost = postRepository.create();
                    newPost.title = "All about animals";
                    return [4 /*yield*/, postRepository.save(newPost)];
                case 2:
                    _a.sent();
                    newUser = userRepository.create();
                    newUser.name = "Dima";
                    return [4 /*yield*/, userRepository.save(newUser)];
                case 3:
                    _a.sent();
                    // now add a category to the post and attach post to a user and save a user
                    newPost.categories = [newCategory];
                    newUser.post = newPost;
                    return [4 /*yield*/, userRepository.save(newUser)];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, userRepository.findOne(newUser.id, {
                            join: {
                                alias: "user",
                                leftJoinAndSelect: { post: "user.post", categories: "post.categories" }
                            }
                        })];
                case 5:
                    loadedUser = _a.sent();
                    chai_1.expect(loadedUser).not.to.be.undefined;
                    chai_1.expect(loadedUser.post).not.to.be.undefined;
                    chai_1.expect(loadedUser.post.categories).not.to.be.undefined;
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("remove one element from many-to-many relation should remove from the database as well", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var postRepository, categoryRepository, userRepository, category1, category2, newPost, newUser, loadedUser1, loadedUser2;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    postRepository = connection.getRepository(Post_1.Post);
                    categoryRepository = connection.getRepository(Category_1.Category);
                    userRepository = connection.getRepository(User_1.User);
                    category1 = new Category_1.Category();
                    category1.name = "Animals";
                    return [4 /*yield*/, categoryRepository.save(category1)];
                case 1:
                    _a.sent();
                    category2 = new Category_1.Category();
                    category2.name = "Animals";
                    return [4 /*yield*/, categoryRepository.save(category2)];
                case 2:
                    _a.sent();
                    newPost = postRepository.create();
                    newPost.title = "All about animals";
                    return [4 /*yield*/, postRepository.save(newPost)];
                case 3:
                    _a.sent();
                    newUser = userRepository.create();
                    newUser.name = "Dima";
                    return [4 /*yield*/, userRepository.save(newUser)];
                case 4:
                    _a.sent();
                    // now categories to the post inside user and save a user
                    newPost.categories = [category1, category2];
                    newUser.post = newPost;
                    return [4 /*yield*/, userRepository.save(newUser)];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, userRepository.findOne(newUser.id, {
                            join: {
                                alias: "user",
                                leftJoinAndSelect: { post: "user.post", categories: "post.categories" }
                            }
                        })];
                case 6:
                    loadedUser1 = _a.sent();
                    chai_1.expect(loadedUser1).not.to.be.undefined;
                    chai_1.expect(loadedUser1.post).not.to.be.undefined;
                    chai_1.expect(loadedUser1.post.categories).not.to.be.undefined;
                    chai_1.expect(loadedUser1.post.categories.length).to.be.equal(2);
                    // now remove added categories
                    newPost.categories = [category1];
                    newUser.post = newPost;
                    return [4 /*yield*/, userRepository.save(newUser)];
                case 7:
                    _a.sent();
                    return [4 /*yield*/, userRepository.findOne(newUser.id, {
                            join: {
                                alias: "user",
                                leftJoinAndSelect: { post: "user.post", categories: "post.categories" }
                            }
                        })];
                case 8:
                    loadedUser2 = _a.sent();
                    chai_1.expect(loadedUser2).not.to.be.undefined;
                    chai_1.expect(loadedUser2.post).not.to.be.undefined;
                    chai_1.expect(loadedUser2.post.categories).not.to.be.undefined;
                    chai_1.expect(loadedUser2.post.categories.length).to.be.equal(1);
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("remove all elements from many-to-many relation should remove from the database as well", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var postRepository, categoryRepository, userRepository, category1, category2, newPost, newUser, loadedUser1, loadedUser2;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    postRepository = connection.getRepository(Post_1.Post);
                    categoryRepository = connection.getRepository(Category_1.Category);
                    userRepository = connection.getRepository(User_1.User);
                    category1 = new Category_1.Category();
                    category1.name = "Animals";
                    return [4 /*yield*/, categoryRepository.save(category1)];
                case 1:
                    _a.sent();
                    category2 = new Category_1.Category();
                    category2.name = "Animals";
                    return [4 /*yield*/, categoryRepository.save(category2)];
                case 2:
                    _a.sent();
                    newPost = postRepository.create();
                    newPost.title = "All about animals";
                    return [4 /*yield*/, postRepository.save(newPost)];
                case 3:
                    _a.sent();
                    newUser = userRepository.create();
                    newUser.name = "Dima";
                    return [4 /*yield*/, userRepository.save(newUser)];
                case 4:
                    _a.sent();
                    // now categories to the post inside user and save a user
                    newPost.categories = [category1, category2];
                    newUser.post = newPost;
                    return [4 /*yield*/, userRepository.save(newUser)];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, userRepository.findOne(newUser.id, {
                            join: {
                                alias: "user",
                                leftJoinAndSelect: { post: "user.post", categories: "post.categories" }
                            }
                        })];
                case 6:
                    loadedUser1 = _a.sent();
                    chai_1.expect(loadedUser1).not.to.be.undefined;
                    chai_1.expect(loadedUser1.post).not.to.be.undefined;
                    chai_1.expect(loadedUser1.post.categories).not.to.be.undefined;
                    chai_1.expect(loadedUser1.post.categories.length).to.be.equal(2);
                    // now remove added categories
                    newPost.categories = [];
                    newUser.post = newPost;
                    return [4 /*yield*/, userRepository.save(newUser)];
                case 7:
                    _a.sent();
                    return [4 /*yield*/, userRepository.findOne(newUser.id, {
                            join: {
                                alias: "user",
                                leftJoinAndSelect: { post: "user.post", categories: "post.categories" }
                            }
                        })];
                case 8:
                    loadedUser2 = _a.sent();
                    chai_1.expect(loadedUser2).not.to.be.undefined;
                    chai_1.expect(loadedUser2.post).not.to.be.undefined;
                    chai_1.expect(loadedUser2.post.categories.length).to.be.equal(0);
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("remove all elements (set to null) from many-to-many relation should remove from the database as well", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var postRepository, categoryRepository, userRepository, category1, category2, newPost, newUser, loadedUser1, loadedUser2;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    postRepository = connection.getRepository(Post_1.Post);
                    categoryRepository = connection.getRepository(Category_1.Category);
                    userRepository = connection.getRepository(User_1.User);
                    category1 = new Category_1.Category();
                    category1.name = "Animals";
                    return [4 /*yield*/, categoryRepository.save(category1)];
                case 1:
                    _a.sent();
                    category2 = new Category_1.Category();
                    category2.name = "Animals";
                    return [4 /*yield*/, categoryRepository.save(category2)];
                case 2:
                    _a.sent();
                    newPost = postRepository.create();
                    newPost.title = "All about animals";
                    return [4 /*yield*/, postRepository.save(newPost)];
                case 3:
                    _a.sent();
                    newUser = userRepository.create();
                    newUser.name = "Dima";
                    return [4 /*yield*/, userRepository.save(newUser)];
                case 4:
                    _a.sent();
                    // now categories to the post inside user and save a user
                    newPost.categories = [category1, category2];
                    newUser.post = newPost;
                    return [4 /*yield*/, userRepository.save(newUser)];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, userRepository.findOne(newUser.id, {
                            join: {
                                alias: "user",
                                leftJoinAndSelect: { post: "user.post", categories: "post.categories" }
                            }
                        })];
                case 6:
                    loadedUser1 = _a.sent();
                    chai_1.expect(loadedUser1).not.to.be.undefined;
                    chai_1.expect(loadedUser1.post).not.to.be.undefined;
                    chai_1.expect(loadedUser1.post.categories).not.to.be.undefined;
                    chai_1.expect(loadedUser1.post.categories.length).to.be.equal(2);
                    // now remove added categories
                    newPost.categories = null;
                    newUser.post = newPost;
                    return [4 /*yield*/, userRepository.save(newUser)];
                case 7:
                    _a.sent();
                    return [4 /*yield*/, userRepository.findOne(newUser.id, {
                            join: {
                                alias: "user",
                                leftJoinAndSelect: { post: "user.post", categories: "post.categories" }
                            }
                        })];
                case 8:
                    loadedUser2 = _a.sent();
                    chai_1.expect(loadedUser2).not.to.be.undefined;
                    chai_1.expect(loadedUser2.post).not.to.be.undefined;
                    chai_1.expect(loadedUser2.post.categories.length).to.be.equal(0);
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("remove all elements from many-to-many relation if parent entity is removed", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var category1, category2, newPost;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    category1 = new Category_1.Category();
                    category1.name = "Animals";
                    return [4 /*yield*/, connection.manager.save(category1)];
                case 1:
                    _a.sent();
                    category2 = new Category_1.Category();
                    category2.name = "Animals";
                    return [4 /*yield*/, connection.manager.save(category2)];
                case 2:
                    _a.sent();
                    newPost = new Post_1.Post();
                    newPost.title = "All about animals";
                    return [4 /*yield*/, connection.manager.save(newPost)];
                case 3:
                    _a.sent();
                    // now categories to the post inside user and save a user
                    newPost.categories = [category1, category2];
                    return [4 /*yield*/, connection.manager.save(newPost)];
                case 4:
                    _a.sent();
                    // this should not give an error:
                    return [4 /*yield*/, connection.manager.remove(newPost)];
                case 5:
                    // this should not give an error:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=persistence-many-to-many.js.map