"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../../utils/test-utils");
var Post_1 = require("./entity/Post");
var Category_1 = require("./entity/Category");
var chai_1 = require("chai");
describe("transaction > transaction with entity manager", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                        enabledDrivers: ["mysql", "sqlite", "postgres"] // todo: for some reasons mariadb tests are not passing here
                    })];
                case 1: return [2 /*return*/, connections = _a.sent()];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should execute all operations in a single transaction", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var postId, categoryId, post, category;
        var _this = this;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    postId = undefined, categoryId = undefined;
                    return [4 /*yield*/, connection.manager.transaction(function (entityManager) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                            var post, category;
                            return tslib_1.__generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        post = new Post_1.Post();
                                        post.title = "Post #1";
                                        return [4 /*yield*/, entityManager.save(post)];
                                    case 1:
                                        _a.sent();
                                        category = new Category_1.Category();
                                        category.name = "Category #1";
                                        return [4 /*yield*/, entityManager.save(category)];
                                    case 2:
                                        _a.sent();
                                        postId = post.id;
                                        categoryId = category.id;
                                        return [2 /*return*/];
                                }
                            });
                        }); })];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, connection.manager.findOne(Post_1.Post, { where: { title: "Post #1" } })];
                case 2:
                    post = _a.sent();
                    chai_1.expect(post).not.to.be.undefined;
                    post.should.be.eql({
                        id: postId,
                        title: "Post #1"
                    });
                    return [4 /*yield*/, connection.manager.findOne(Category_1.Category, { where: { name: "Category #1" } })];
                case 3:
                    category = _a.sent();
                    chai_1.expect(category).not.to.be.undefined;
                    category.should.be.eql({
                        id: categoryId,
                        name: "Category #1"
                    });
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should not save anything if any of operation in transaction fail", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var postId, categoryId, err_1, post, category;
        var _this = this;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    postId = undefined, categoryId = undefined;
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, connection.manager.transaction(function (entityManager) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                            var post, category, loadedPost, loadedCategory, wrongPost;
                            return tslib_1.__generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        post = new Post_1.Post();
                                        post.title = "Post #1";
                                        return [4 /*yield*/, entityManager.save(post)];
                                    case 1:
                                        _a.sent();
                                        category = new Category_1.Category();
                                        category.name = "Category #1";
                                        return [4 /*yield*/, entityManager.save(category)];
                                    case 2:
                                        _a.sent();
                                        postId = post.id;
                                        categoryId = category.id;
                                        return [4 /*yield*/, entityManager.findOne(Post_1.Post, { where: { title: "Post #1" } })];
                                    case 3:
                                        loadedPost = _a.sent();
                                        chai_1.expect(loadedPost).not.to.be.undefined;
                                        loadedPost.should.be.eql({
                                            id: postId,
                                            title: "Post #1"
                                        });
                                        return [4 /*yield*/, entityManager.findOne(Category_1.Category, { where: { name: "Category #1" } })];
                                    case 4:
                                        loadedCategory = _a.sent();
                                        chai_1.expect(loadedCategory).not.to.be.undefined;
                                        loadedCategory.should.be.eql({
                                            id: categoryId,
                                            name: "Category #1"
                                        });
                                        wrongPost = new Post_1.Post();
                                        return [4 /*yield*/, entityManager.save(wrongPost)];
                                    case 5:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); })];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    err_1 = _a.sent();
                    return [3 /*break*/, 4];
                case 4: return [4 /*yield*/, connection.manager.findOne(Post_1.Post, { where: { title: "Post #1" } })];
                case 5:
                    post = _a.sent();
                    chai_1.expect(post).to.be.undefined;
                    return [4 /*yield*/, connection.manager.findOne(Category_1.Category, { where: { name: "Category #1" } })];
                case 6:
                    category = _a.sent();
                    chai_1.expect(category).to.be.undefined;
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=transaction-in-entity-manager.js.map