"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var chai_1 = require("chai");
var test_utils_1 = require("../../../../utils/test-utils");
var Category_1 = require("./entity/Category");
var Post_1 = require("./entity/Post");
describe("decorators > relation-id > one-to-one", function () {
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
    it("should load ids when loadRelationIdAndMap used on owner side", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var category1, category2, categoryByName1, categoryByName2, post1, post2, loadedPosts, loadedPost;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    category1 = new Category_1.Category();
                    category1.id = 1;
                    category1.name = "cars";
                    return [4 /*yield*/, connection.manager.save(category1)];
                case 1:
                    _a.sent();
                    category2 = new Category_1.Category();
                    category2.id = 2;
                    category2.name = "airplanes";
                    return [4 /*yield*/, connection.manager.save(category2)];
                case 2:
                    _a.sent();
                    categoryByName1 = new Category_1.Category();
                    categoryByName1.id = 3;
                    categoryByName1.name = "BMW";
                    return [4 /*yield*/, connection.manager.save(categoryByName1)];
                case 3:
                    _a.sent();
                    categoryByName2 = new Category_1.Category();
                    categoryByName2.id = 4;
                    categoryByName2.name = "Boeing";
                    return [4 /*yield*/, connection.manager.save(categoryByName2)];
                case 4:
                    _a.sent();
                    post1 = new Post_1.Post();
                    post1.id = 1;
                    post1.title = "about BMW";
                    post1.category = category1;
                    post1.categoryByName = categoryByName1;
                    return [4 /*yield*/, connection.manager.save(post1)];
                case 5:
                    _a.sent();
                    post2 = new Post_1.Post();
                    post2.id = 2;
                    post2.title = "about Boeing";
                    post2.category = category2;
                    post2.categoryByName = categoryByName2;
                    return [4 /*yield*/, connection.manager.save(post2)];
                case 6:
                    _a.sent();
                    return [4 /*yield*/, connection.manager
                            .createQueryBuilder(Post_1.Post, "post")
                            .addOrderBy("post.id")
                            .getMany()];
                case 7:
                    loadedPosts = _a.sent();
                    chai_1.expect(loadedPosts[0].categoryId).to.not.be.undefined;
                    chai_1.expect(loadedPosts[0].categoryId).to.be.equal(1);
                    chai_1.expect(loadedPosts[0].categoryName).to.not.be.undefined;
                    chai_1.expect(loadedPosts[0].categoryName).to.be.equal("BMW");
                    chai_1.expect(loadedPosts[1].categoryId).to.not.be.undefined;
                    chai_1.expect(loadedPosts[1].categoryId).to.be.equal(2);
                    chai_1.expect(loadedPosts[1].categoryName).to.not.be.undefined;
                    chai_1.expect(loadedPosts[1].categoryName).to.be.equal("Boeing");
                    return [4 /*yield*/, connection.manager
                            .createQueryBuilder(Post_1.Post, "post")
                            .where("post.id = :id", { id: 1 })
                            .getOne()];
                case 8:
                    loadedPost = _a.sent();
                    chai_1.expect(loadedPost.categoryId).to.not.be.undefined;
                    chai_1.expect(loadedPost.categoryId).to.be.equal(1);
                    chai_1.expect(loadedPost.categoryName).to.not.be.undefined;
                    chai_1.expect(loadedPost.categoryName).to.be.equal("BMW");
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should load id when loadRelationIdAndMap used on inverse side", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var category1, category2, post1, post2, loadedCategories, loadedCategory;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    category1 = new Category_1.Category();
                    category1.id = 1;
                    category1.name = "cars";
                    return [4 /*yield*/, connection.manager.save(category1)];
                case 1:
                    _a.sent();
                    category2 = new Category_1.Category();
                    category2.id = 2;
                    category2.name = "airplanes";
                    return [4 /*yield*/, connection.manager.save(category2)];
                case 2:
                    _a.sent();
                    post1 = new Post_1.Post();
                    post1.id = 1;
                    post1.title = "about BMW";
                    post1.category2 = category1;
                    return [4 /*yield*/, connection.manager.save(post1)];
                case 3:
                    _a.sent();
                    post2 = new Post_1.Post();
                    post2.id = 2;
                    post2.title = "about Boeing";
                    post2.category2 = category2;
                    return [4 /*yield*/, connection.manager.save(post2)];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, connection.manager
                            .createQueryBuilder(Category_1.Category, "category")
                            .addOrderBy("category.id")
                            .getMany()];
                case 5:
                    loadedCategories = _a.sent();
                    chai_1.expect(loadedCategories[0].postId).to.not.be.undefined;
                    chai_1.expect(loadedCategories[0].postId).to.be.equal(1);
                    chai_1.expect(loadedCategories[1].postId).to.not.be.undefined;
                    chai_1.expect(loadedCategories[1].postId).to.be.equal(2);
                    return [4 /*yield*/, connection.manager
                            .createQueryBuilder(Category_1.Category, "category")
                            .where("category.id = :id", { id: 1 })
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
//# sourceMappingURL=relation-id-decorator-one-to-one.js.map