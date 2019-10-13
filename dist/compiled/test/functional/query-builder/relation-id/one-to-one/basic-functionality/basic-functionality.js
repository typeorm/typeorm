"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var chai_1 = require("chai");
var test_utils_1 = require("../../../../../utils/test-utils");
var Category_1 = require("./entity/Category");
var Post_1 = require("./entity/Post");
describe("query builder > relation-id > one-to-one > basic-functionality", function () {
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
    it("should load ids when loadRelationIdAndMap used with OneToOne owner side relation", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var category, post, category2, post2, loadedPosts, loadedPost;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    category = new Category_1.Category();
                    category.name = "kids";
                    return [4 /*yield*/, connection.manager.save(category)];
                case 1:
                    _a.sent();
                    post = new Post_1.Post();
                    post.title = "about kids";
                    post.category = category;
                    return [4 /*yield*/, connection.manager.save(post)];
                case 2:
                    _a.sent();
                    category2 = new Category_1.Category();
                    category2.name = "cars";
                    return [4 /*yield*/, connection.manager.save(category2)];
                case 3:
                    _a.sent();
                    post2 = new Post_1.Post();
                    post2.title = "about cars";
                    post2.category = category2;
                    return [4 /*yield*/, connection.manager.save(post2)];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, connection.manager
                            .createQueryBuilder(Post_1.Post, "post")
                            .loadRelationIdAndMap("post.categoryId", "post.category")
                            .getMany()];
                case 5:
                    loadedPosts = _a.sent();
                    chai_1.expect(loadedPosts[0].categoryId).to.not.be.undefined;
                    chai_1.expect(loadedPosts[0].categoryId).to.be.equal(1);
                    chai_1.expect(loadedPosts[1].categoryId).to.not.be.undefined;
                    chai_1.expect(loadedPosts[1].categoryId).to.be.equal(2);
                    return [4 /*yield*/, connection.manager
                            .createQueryBuilder(Post_1.Post, "post")
                            .loadRelationIdAndMap("post.categoryId", "post.category")
                            .where("post.id = :id", { id: post.id })
                            .getOne()];
                case 6:
                    loadedPost = _a.sent();
                    chai_1.expect(loadedPost.categoryId).to.not.be.undefined;
                    chai_1.expect(loadedPost.categoryId).to.be.equal(1);
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should load id when loadRelationIdAndMap used with OneToOne inverse side relation", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var category, post, category2, post2, loadedCategories, loadedCategory;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    category = new Category_1.Category();
                    category.name = "kids";
                    return [4 /*yield*/, connection.manager.save(category)];
                case 1:
                    _a.sent();
                    post = new Post_1.Post();
                    post.title = "about kids";
                    post.category2 = category;
                    return [4 /*yield*/, connection.manager.save(post)];
                case 2:
                    _a.sent();
                    category2 = new Category_1.Category();
                    category2.name = "cars";
                    return [4 /*yield*/, connection.manager.save(category2)];
                case 3:
                    _a.sent();
                    post2 = new Post_1.Post();
                    post2.title = "about cars";
                    post2.category2 = category2;
                    return [4 /*yield*/, connection.manager.save(post2)];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, connection.manager
                            .createQueryBuilder(Category_1.Category, "category")
                            .loadRelationIdAndMap("category.postId", "category.post")
                            .getMany()];
                case 5:
                    loadedCategories = _a.sent();
                    chai_1.expect(loadedCategories[0].postId).to.not.be.undefined;
                    chai_1.expect(loadedCategories[0].postId).to.be.equal(1);
                    chai_1.expect(loadedCategories[1].postId).to.not.be.undefined;
                    chai_1.expect(loadedCategories[1].postId).to.be.equal(2);
                    return [4 /*yield*/, connection.manager
                            .createQueryBuilder(Category_1.Category, "category")
                            .loadRelationIdAndMap("category.postId", "category.post")
                            .getOne()];
                case 6:
                    loadedCategory = _a.sent();
                    chai_1.expect(loadedCategory.postId).to.not.be.undefined;
                    chai_1.expect(loadedCategory.postId).to.be.equal(1);
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=basic-functionality.js.map