"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var chai_1 = require("chai");
var test_utils_1 = require("../../../../utils/test-utils");
var Category_1 = require("./entity/Category");
var Post_1 = require("./entity/Post");
var Image_1 = require("./entity/Image");
describe("query builder > load-relation-count-and-map > one-to-many", function () {
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
    it("should load relation count", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var category1, category2, category3, post1, post2, loadedPosts, loadedPost;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    category1 = new Category_1.Category();
                    category1.name = "cars";
                    return [4 /*yield*/, connection.manager.save(category1)];
                case 1:
                    _a.sent();
                    category2 = new Category_1.Category();
                    category2.name = "BMW";
                    return [4 /*yield*/, connection.manager.save(category2)];
                case 2:
                    _a.sent();
                    category3 = new Category_1.Category();
                    category3.name = "airplanes";
                    return [4 /*yield*/, connection.manager.save(category3)];
                case 3:
                    _a.sent();
                    post1 = new Post_1.Post();
                    post1.title = "about BMW";
                    post1.categories = [category1, category2];
                    return [4 /*yield*/, connection.manager.save(post1)];
                case 4:
                    _a.sent();
                    post2 = new Post_1.Post();
                    post2.title = "about Boeing";
                    post2.categories = [category3];
                    return [4 /*yield*/, connection.manager.save(post2)];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, connection.manager
                            .createQueryBuilder(Post_1.Post, "post")
                            .loadRelationCountAndMap("post.categoryCount", "post.categories")
                            .getMany()];
                case 6:
                    loadedPosts = _a.sent();
                    chai_1.expect(loadedPosts[0].categoryCount).to.be.equal(2);
                    chai_1.expect(loadedPosts[1].categoryCount).to.be.equal(1);
                    return [4 /*yield*/, connection.manager
                            .createQueryBuilder(Post_1.Post, "post")
                            .loadRelationCountAndMap("post.categoryCount", "post.categories")
                            .where("post.id = :id", { id: 1 })
                            .getOne()];
                case 7:
                    loadedPost = _a.sent();
                    chai_1.expect(loadedPost.categoryCount).to.be.equal(2);
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should load relation count on nested relations", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var image1, image2, image3, category1, category2, category3, post1, post2, loadedPosts, loadedPost;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    image1 = new Image_1.Image();
                    image1.name = "image #1";
                    return [4 /*yield*/, connection.manager.save(image1)];
                case 1:
                    _a.sent();
                    image2 = new Image_1.Image();
                    image2.name = "image #2";
                    return [4 /*yield*/, connection.manager.save(image2)];
                case 2:
                    _a.sent();
                    image3 = new Image_1.Image();
                    image3.name = "image #3";
                    return [4 /*yield*/, connection.manager.save(image3)];
                case 3:
                    _a.sent();
                    category1 = new Category_1.Category();
                    category1.name = "cars";
                    category1.images = [image1, image2];
                    return [4 /*yield*/, connection.manager.save(category1)];
                case 4:
                    _a.sent();
                    category2 = new Category_1.Category();
                    category2.name = "BMW";
                    return [4 /*yield*/, connection.manager.save(category2)];
                case 5:
                    _a.sent();
                    category3 = new Category_1.Category();
                    category3.name = "airplanes";
                    category3.images = [image3];
                    return [4 /*yield*/, connection.manager.save(category3)];
                case 6:
                    _a.sent();
                    post1 = new Post_1.Post();
                    post1.title = "about BMW";
                    post1.categories = [category1, category2];
                    return [4 /*yield*/, connection.manager.save(post1)];
                case 7:
                    _a.sent();
                    post2 = new Post_1.Post();
                    post2.title = "about Boeing";
                    post2.categories = [category3];
                    return [4 /*yield*/, connection.manager.save(post2)];
                case 8:
                    _a.sent();
                    return [4 /*yield*/, connection.manager
                            .createQueryBuilder(Post_1.Post, "post")
                            .leftJoinAndSelect("post.categories", "categories")
                            .loadRelationCountAndMap("post.categoryCount", "post.categories")
                            .loadRelationCountAndMap("categories.imageCount", "categories.images")
                            .addOrderBy("post.id, categories.id")
                            .getMany()];
                case 9:
                    loadedPosts = _a.sent();
                    chai_1.expect(loadedPosts[0].categoryCount).to.be.equal(2);
                    chai_1.expect(loadedPosts[0].categories[0].imageCount).to.be.equal(2);
                    chai_1.expect(loadedPosts[0].categories[1].imageCount).to.be.equal(0);
                    chai_1.expect(loadedPosts[1].categoryCount).to.be.equal(1);
                    chai_1.expect(loadedPosts[1].categories[0].imageCount).to.be.equal(1);
                    return [4 /*yield*/, connection.manager
                            .createQueryBuilder(Post_1.Post, "post")
                            .leftJoinAndSelect("post.categories", "categories")
                            .loadRelationCountAndMap("post.categoryCount", "post.categories")
                            .loadRelationCountAndMap("categories.imageCount", "categories.images")
                            .where("post.id = :id", { id: 1 })
                            .addOrderBy("post.id, categories.id")
                            .getOne()];
                case 10:
                    loadedPost = _a.sent();
                    chai_1.expect(loadedPost.categoryCount).to.be.equal(2);
                    chai_1.expect(loadedPost.categories[0].imageCount).to.be.equal(2);
                    chai_1.expect(loadedPost.categories[1].imageCount).to.be.equal(0);
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should load relation count with additional conditions", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var category1, category2, category3, post1, post2, loadedPosts, loadedPost;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    category1 = new Category_1.Category();
                    category1.name = "cars";
                    category1.isRemoved = true;
                    return [4 /*yield*/, connection.manager.save(category1)];
                case 1:
                    _a.sent();
                    category2 = new Category_1.Category();
                    category2.name = "BMW";
                    return [4 /*yield*/, connection.manager.save(category2)];
                case 2:
                    _a.sent();
                    category3 = new Category_1.Category();
                    category3.name = "airplanes";
                    return [4 /*yield*/, connection.manager.save(category3)];
                case 3:
                    _a.sent();
                    post1 = new Post_1.Post();
                    post1.title = "about BMW";
                    post1.categories = [category1, category2];
                    return [4 /*yield*/, connection.manager.save(post1)];
                case 4:
                    _a.sent();
                    post2 = new Post_1.Post();
                    post2.title = "about Boeing";
                    post2.categories = [category3];
                    return [4 /*yield*/, connection.manager.save(post2)];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, connection.manager
                            .createQueryBuilder(Post_1.Post, "post")
                            .loadRelationCountAndMap("post.categoryCount", "post.categories")
                            .loadRelationCountAndMap("post.removedCategoryCount", "post.categories", "rc", function (qb) { return qb.andWhere("rc.isRemoved = :isRemoved", { isRemoved: true }); })
                            .getMany()];
                case 6:
                    loadedPosts = _a.sent();
                    chai_1.expect(loadedPosts[0].categoryCount).to.be.equal(2);
                    chai_1.expect(loadedPosts[0].removedCategoryCount).to.be.equal(1);
                    chai_1.expect(loadedPosts[1].categoryCount).to.be.equal(1);
                    return [4 /*yield*/, connection.manager
                            .createQueryBuilder(Post_1.Post, "post")
                            .loadRelationCountAndMap("post.categoryCount", "post.categories")
                            .loadRelationCountAndMap("post.removedCategoryCount", "post.categories", "rc", function (qb) { return qb.andWhere("rc.isRemoved = :isRemoved", { isRemoved: true }); })
                            .where("post.id = :id", { id: 1 })
                            .getOne()];
                case 7:
                    loadedPost = _a.sent();
                    chai_1.expect(loadedPost.categoryCount).to.be.equal(2);
                    chai_1.expect(loadedPost.removedCategoryCount).to.be.equal(1);
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=load-relation-count-and-map-one-to-many.js.map