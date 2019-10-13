"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var chai_1 = require("chai");
var Post_1 = require("./entity/Post");
var Category_1 = require("./entity/Category");
var test_utils_1 = require("../../../utils/test-utils");
describe("persistence > one-to-many", function () {
    // -------------------------------------------------------------------------
    // Setup
    // -------------------------------------------------------------------------
    var _this = this;
    var connections;
    before(function () {
        return test_utils_1.createTestingConnections({
            entities: [Post_1.Post, Category_1.Category],
        }).then(function (all) { return connections = all; });
    });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    // -------------------------------------------------------------------------
    // Specifications
    // -------------------------------------------------------------------------
    it("should add exist element to exist object with empty one-to-many relation and save it", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var postRepository, categoryRepository, newCategory, newPost, loadedPost;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    postRepository = connection.getRepository(Post_1.Post);
                    categoryRepository = connection.getRepository(Category_1.Category);
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
                    newPost.categories = [newCategory];
                    return [4 /*yield*/, postRepository.save(newPost)];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, postRepository.findOne(newPost.id, { relations: ["categories"] })];
                case 4:
                    loadedPost = _a.sent();
                    chai_1.expect(loadedPost).not.to.be.undefined;
                    chai_1.expect(loadedPost.categories).not.to.be.undefined;
                    chai_1.expect(loadedPost.categories[0]).not.to.be.undefined;
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should add exist element to new object with empty one-to-many relation and save it", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var postRepository, categoryRepository, newCategory, newPost, loadedPost;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    postRepository = connection.getRepository(Post_1.Post);
                    categoryRepository = connection.getRepository(Category_1.Category);
                    newCategory = categoryRepository.create();
                    newCategory.name = "Animals";
                    return [4 /*yield*/, categoryRepository.save(newCategory)];
                case 1:
                    _a.sent();
                    newPost = postRepository.create();
                    newPost.title = "All about animals";
                    newPost.categories = [newCategory];
                    return [4 /*yield*/, postRepository.save(newPost)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, postRepository.findOne(newPost.id, { relations: ["categories"] })];
                case 3:
                    loadedPost = _a.sent();
                    chai_1.expect(loadedPost).not.to.be.undefined;
                    chai_1.expect(loadedPost.categories).not.to.be.undefined;
                    chai_1.expect(loadedPost.categories[0]).not.to.be.undefined;
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should remove exist element from one-to-many relation and save it", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var postRepository, categoryRepository, firstNewCategory, secondNewCategory, newPost, loadedPost;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    postRepository = connection.getRepository(Post_1.Post);
                    categoryRepository = connection.getRepository(Category_1.Category);
                    firstNewCategory = categoryRepository.create();
                    firstNewCategory.name = "Animals";
                    return [4 /*yield*/, categoryRepository.save(firstNewCategory)];
                case 1:
                    _a.sent();
                    secondNewCategory = categoryRepository.create();
                    secondNewCategory.name = "Insects";
                    return [4 /*yield*/, categoryRepository.save(secondNewCategory)];
                case 2:
                    _a.sent();
                    newPost = postRepository.create();
                    newPost.title = "All about animals";
                    return [4 /*yield*/, postRepository.save(newPost)];
                case 3:
                    _a.sent();
                    newPost.categories = [firstNewCategory, secondNewCategory];
                    return [4 /*yield*/, postRepository.save(newPost)];
                case 4:
                    _a.sent();
                    newPost.categories = [firstNewCategory];
                    return [4 /*yield*/, postRepository.save(newPost)];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, postRepository.findOne(newPost.id, {
                            join: {
                                alias: "post",
                                innerJoinAndSelect: {
                                    categories: "post.categories"
                                }
                            }
                        })];
                case 6:
                    loadedPost = _a.sent();
                    chai_1.expect(loadedPost).not.to.be.undefined;
                    chai_1.expect(loadedPost.categories).not.to.be.undefined;
                    chai_1.expect(loadedPost.categories[0]).not.to.be.undefined;
                    chai_1.expect(loadedPost.categories[1]).to.be.undefined;
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should remove all elements from one-to-many relation and save it", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var postRepository, categoryRepository, firstNewCategory, secondNewCategory, newPost, loadedPost;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    postRepository = connection.getRepository(Post_1.Post);
                    categoryRepository = connection.getRepository(Category_1.Category);
                    firstNewCategory = categoryRepository.create();
                    firstNewCategory.name = "Animals";
                    return [4 /*yield*/, categoryRepository.save(firstNewCategory)];
                case 1:
                    _a.sent();
                    secondNewCategory = categoryRepository.create();
                    secondNewCategory.name = "Insects";
                    return [4 /*yield*/, categoryRepository.save(secondNewCategory)];
                case 2:
                    _a.sent();
                    newPost = postRepository.create();
                    newPost.title = "All about animals";
                    return [4 /*yield*/, postRepository.save(newPost)];
                case 3:
                    _a.sent();
                    newPost.categories = [firstNewCategory, secondNewCategory];
                    return [4 /*yield*/, postRepository.save(newPost)];
                case 4:
                    _a.sent();
                    newPost.categories = [];
                    return [4 /*yield*/, postRepository.save(newPost)];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, postRepository.findOne(newPost.id, {
                            join: {
                                alias: "post",
                                leftJoinAndSelect: {
                                    categories: "post.categories"
                                }
                            }
                        })];
                case 6:
                    loadedPost = _a.sent();
                    chai_1.expect(loadedPost).not.to.be.undefined;
                    chai_1.expect(loadedPost.categories).to.be.eql([]);
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("set relation to null (elements exist there) from one-to-many relation and save it", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var postRepository, categoryRepository, firstNewCategory, secondNewCategory, newPost, loadedPost;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    postRepository = connection.getRepository(Post_1.Post);
                    categoryRepository = connection.getRepository(Category_1.Category);
                    firstNewCategory = categoryRepository.create();
                    firstNewCategory.name = "Animals";
                    return [4 /*yield*/, categoryRepository.save(firstNewCategory)];
                case 1:
                    _a.sent();
                    secondNewCategory = categoryRepository.create();
                    secondNewCategory.name = "Insects";
                    return [4 /*yield*/, categoryRepository.save(secondNewCategory)];
                case 2:
                    _a.sent();
                    newPost = postRepository.create();
                    newPost.title = "All about animals";
                    return [4 /*yield*/, postRepository.save(newPost)];
                case 3:
                    _a.sent();
                    newPost.categories = [firstNewCategory, secondNewCategory];
                    return [4 /*yield*/, postRepository.save(newPost)];
                case 4:
                    _a.sent();
                    newPost.categories = null;
                    return [4 /*yield*/, postRepository.save(newPost)];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, postRepository.findOne(newPost.id, {
                            join: {
                                alias: "post",
                                leftJoinAndSelect: {
                                    categories: "post.categories"
                                }
                            }
                        })];
                case 6:
                    loadedPost = (_a.sent());
                    chai_1.expect(loadedPost).not.to.be.undefined;
                    chai_1.expect(loadedPost.categories).to.be.eql([]);
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=persistence-one-to-many.js.map