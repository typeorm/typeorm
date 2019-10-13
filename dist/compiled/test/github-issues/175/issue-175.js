"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var Post_1 = require("./entity/Post");
var Category_1 = require("./entity/Category");
var chai_1 = require("chai");
describe("github issues > #175 ManyToMany relation doesn't put an empty array when the relation is empty", function () {
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
    it("should return post with categories if they are attached to the post", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var category1, category2, postWithCategories, loadedPost;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    category1 = new Category_1.Category();
                    category1.name = "category #1";
                    return [4 /*yield*/, connection.manager.save(category1)];
                case 1:
                    _a.sent();
                    category2 = new Category_1.Category();
                    category2.name = "category #2";
                    return [4 /*yield*/, connection.manager.save(category2)];
                case 2:
                    _a.sent();
                    postWithCategories = new Post_1.Post();
                    postWithCategories.title = "post with categories";
                    postWithCategories.categories = [category1, category2];
                    return [4 /*yield*/, connection.manager.save(postWithCategories)];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, connection.manager
                            .createQueryBuilder(Post_1.Post, "post")
                            .leftJoinAndSelect("post.categories", "categories")
                            .where("post.title = :title", { title: "post with categories" })
                            .getOne()];
                case 4:
                    loadedPost = _a.sent();
                    chai_1.expect(loadedPost).not.to.be.undefined;
                    loadedPost.should.be.eql({
                        id: 1,
                        title: "post with categories",
                        categories: [{
                                id: 1,
                                name: "category #1"
                            }, {
                                id: 2,
                                name: "category #2"
                            }]
                    });
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should return post with categories even if post with empty categories was saved", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var category1, category2, postWithoutCategories, justPost, loadedPost;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    category1 = new Category_1.Category();
                    category1.name = "category #1";
                    return [4 /*yield*/, connection.manager.save(category1)];
                case 1:
                    _a.sent();
                    category2 = new Category_1.Category();
                    category2.name = "category #2";
                    return [4 /*yield*/, connection.manager.save(category2)];
                case 2:
                    _a.sent();
                    postWithoutCategories = new Post_1.Post();
                    postWithoutCategories.title = "post without categories";
                    postWithoutCategories.categories = [];
                    return [4 /*yield*/, connection.manager.save(postWithoutCategories)];
                case 3:
                    _a.sent();
                    justPost = new Post_1.Post();
                    justPost.title = "just post";
                    return [4 /*yield*/, connection.manager
                            .createQueryBuilder(Post_1.Post, "post")
                            .leftJoinAndSelect("post.categories", "categories")
                            .where("post.title = :title", { title: "post without categories" })
                            .getOne()];
                case 4:
                    loadedPost = _a.sent();
                    chai_1.expect(loadedPost).not.to.be.undefined;
                    loadedPost.should.be.eql({
                        id: 1,
                        title: "post without categories",
                        categories: []
                    });
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should return post with categories even if post was saved without categories set", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var category1, category2, justPost, loadedPost;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    category1 = new Category_1.Category();
                    category1.name = "category #1";
                    return [4 /*yield*/, connection.manager.save(category1)];
                case 1:
                    _a.sent();
                    category2 = new Category_1.Category();
                    category2.name = "category #2";
                    return [4 /*yield*/, connection.manager.save(category2)];
                case 2:
                    _a.sent();
                    justPost = new Post_1.Post();
                    justPost.title = "just post";
                    return [4 /*yield*/, connection.manager.save(justPost)];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, connection.manager
                            .createQueryBuilder(Post_1.Post, "post")
                            .leftJoinAndSelect("post.secondaryCategories", "secondaryCategories")
                            .where("post.title = :title", { title: "just post" })
                            .getOne()];
                case 4:
                    loadedPost = _a.sent();
                    chai_1.expect(loadedPost).not.to.be.undefined;
                    loadedPost.should.be.eql({
                        id: 1,
                        title: "just post",
                        secondaryCategories: []
                    });
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-175.js.map