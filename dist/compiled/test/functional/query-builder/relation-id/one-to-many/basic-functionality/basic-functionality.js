"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var chai_1 = require("chai");
var test_utils_1 = require("../../../../../utils/test-utils");
var Category_1 = require("./entity/Category");
var Post_1 = require("./entity/Post");
var Image_1 = require("./entity/Image");
describe("query builder > relation-id > one-to-many > basic-functionality", function () {
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
    it("should load id when loadRelationIdAndMap used with OneToMany relation", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var category1, category2, category3, category4, post1, post2, loadedPosts, loadedPost;
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
                    category4 = new Category_1.Category();
                    category4.name = "Boeing";
                    return [4 /*yield*/, connection.manager.save(category4)];
                case 4:
                    _a.sent();
                    post1 = new Post_1.Post();
                    post1.title = "about BMW";
                    post1.categories = [category1, category2];
                    return [4 /*yield*/, connection.manager.save(post1)];
                case 5:
                    _a.sent();
                    post2 = new Post_1.Post();
                    post2.title = "about Audi";
                    post2.categories = [category3, category4];
                    return [4 /*yield*/, connection.manager.save(post2)];
                case 6:
                    _a.sent();
                    return [4 /*yield*/, connection.manager
                            .createQueryBuilder(Post_1.Post, "post")
                            .loadRelationIdAndMap("post.categoryIds", "post.categories")
                            .getMany()];
                case 7:
                    loadedPosts = _a.sent();
                    chai_1.expect(loadedPosts[0].categoryIds).to.not.be.eql([]);
                    chai_1.expect(loadedPosts[0].categoryIds.length).to.be.equal(2);
                    chai_1.expect(loadedPosts[0].categoryIds[0]).to.be.equal(1);
                    chai_1.expect(loadedPosts[0].categoryIds[1]).to.be.equal(2);
                    chai_1.expect(loadedPosts[1].categoryIds).to.not.be.eql([]);
                    chai_1.expect(loadedPosts[1].categoryIds.length).to.be.equal(2);
                    chai_1.expect(loadedPosts[1].categoryIds[0]).to.be.equal(3);
                    chai_1.expect(loadedPosts[1].categoryIds[1]).to.be.equal(4);
                    return [4 /*yield*/, connection.manager
                            .createQueryBuilder(Post_1.Post, "post")
                            .loadRelationIdAndMap("post.categoryIds", "post.categories")
                            .where("post.id = :id", { id: 1 })
                            .getOne()];
                case 8:
                    loadedPost = _a.sent();
                    chai_1.expect(loadedPost.categoryIds).to.not.be.eql([]);
                    chai_1.expect(loadedPost.categoryIds.length).to.be.equal(2);
                    chai_1.expect(loadedPost.categoryIds[0]).to.be.equal(1);
                    chai_1.expect(loadedPost.categoryIds[1]).to.be.equal(2);
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should load id when loadRelationIdAndMap used with additional condition", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var category1, category2, category3, category4, post1, post2, loadedPosts, loadedPost;
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
                    category2.isRemoved = true;
                    return [4 /*yield*/, connection.manager.save(category2)];
                case 2:
                    _a.sent();
                    category3 = new Category_1.Category();
                    category3.name = "airplanes";
                    return [4 /*yield*/, connection.manager.save(category3)];
                case 3:
                    _a.sent();
                    category4 = new Category_1.Category();
                    category4.name = "Boeing";
                    category4.isRemoved = true;
                    return [4 /*yield*/, connection.manager.save(category4)];
                case 4:
                    _a.sent();
                    post1 = new Post_1.Post();
                    post1.title = "about BMW";
                    post1.categories = [category1, category2];
                    return [4 /*yield*/, connection.manager.save(post1)];
                case 5:
                    _a.sent();
                    post2 = new Post_1.Post();
                    post2.title = "about Audi";
                    post2.categories = [category3, category4];
                    return [4 /*yield*/, connection.manager.save(post2)];
                case 6:
                    _a.sent();
                    return [4 /*yield*/, connection.manager
                            .createQueryBuilder(Post_1.Post, "post")
                            .loadRelationIdAndMap("post.categoryIds", "post.categories", "category", function (qb) { return qb.andWhere("category.isRemoved = :isRemoved", { isRemoved: true }); })
                            .getMany()];
                case 7:
                    loadedPosts = _a.sent();
                    chai_1.expect(loadedPosts[0].categoryIds).to.not.be.eql([]);
                    chai_1.expect(loadedPosts[0].categoryIds.length).to.be.equal(1);
                    chai_1.expect(loadedPosts[0].categoryIds[0]).to.be.equal(2);
                    chai_1.expect(loadedPosts[1].categoryIds).to.not.be.eql([]);
                    chai_1.expect(loadedPosts[1].categoryIds.length).to.be.equal(1);
                    chai_1.expect(loadedPosts[1].categoryIds[0]).to.be.equal(4);
                    return [4 /*yield*/, connection.manager
                            .createQueryBuilder(Post_1.Post, "post")
                            .loadRelationIdAndMap("post.categoryIds", "post.categories", "category", function (qb) { return qb.andWhere("category.id = :categoryId", { categoryId: 1 }); })
                            .where("post.id = :id", { id: 1 })
                            .getOne()];
                case 8:
                    loadedPost = _a.sent();
                    chai_1.expect(loadedPost.categoryIds).to.not.be.eql([]);
                    chai_1.expect(loadedPost.categoryIds.length).to.be.equal(1);
                    chai_1.expect(loadedPost.categoryIds[0]).to.be.equal(1);
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should load id when loadRelationIdAndMap used on nested relation", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var image1, image2, image3, image4, image5, category1, category2, category3, category4, post1, post2, loadedPosts, loadedPost;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    image1 = new Image_1.Image();
                    image1.name = "Image #1";
                    return [4 /*yield*/, connection.manager.save(image1)];
                case 1:
                    _a.sent();
                    image2 = new Image_1.Image();
                    image2.name = "Image #2";
                    return [4 /*yield*/, connection.manager.save(image2)];
                case 2:
                    _a.sent();
                    image3 = new Image_1.Image();
                    image3.name = "Image #3";
                    return [4 /*yield*/, connection.manager.save(image3)];
                case 3:
                    _a.sent();
                    image4 = new Image_1.Image();
                    image4.name = "Image #4";
                    return [4 /*yield*/, connection.manager.save(image4)];
                case 4:
                    _a.sent();
                    image5 = new Image_1.Image();
                    image5.name = "Image #5";
                    return [4 /*yield*/, connection.manager.save(image5)];
                case 5:
                    _a.sent();
                    category1 = new Category_1.Category();
                    category1.name = "cars";
                    category1.images = [image1, image2];
                    return [4 /*yield*/, connection.manager.save(category1)];
                case 6:
                    _a.sent();
                    category2 = new Category_1.Category();
                    category2.name = "BMW";
                    category2.images = [image3];
                    return [4 /*yield*/, connection.manager.save(category2)];
                case 7:
                    _a.sent();
                    category3 = new Category_1.Category();
                    category3.name = "airplanes";
                    category3.images = [image4, image5];
                    return [4 /*yield*/, connection.manager.save(category3)];
                case 8:
                    _a.sent();
                    category4 = new Category_1.Category();
                    category4.name = "Boeing";
                    return [4 /*yield*/, connection.manager.save(category4)];
                case 9:
                    _a.sent();
                    post1 = new Post_1.Post();
                    post1.title = "about BMW";
                    post1.categories = [category1, category2];
                    return [4 /*yield*/, connection.manager.save(post1)];
                case 10:
                    _a.sent();
                    post2 = new Post_1.Post();
                    post2.title = "about Audi";
                    post2.categories = [category3, category4];
                    return [4 /*yield*/, connection.manager.save(post2)];
                case 11:
                    _a.sent();
                    return [4 /*yield*/, connection.manager
                            .createQueryBuilder(Post_1.Post, "post")
                            .loadRelationIdAndMap("post.categoryIds", "post.categories")
                            .leftJoinAndSelect("post.categories", "category")
                            .loadRelationIdAndMap("category.imageIds", "category.images")
                            .orderBy("category.id")
                            .getMany()];
                case 12:
                    loadedPosts = _a.sent();
                    chai_1.expect(loadedPosts[0].categoryIds).to.not.be.eql([]);
                    chai_1.expect(loadedPosts[0].categoryIds.length).to.be.equal(2);
                    chai_1.expect(loadedPosts[0].categoryIds[0]).to.be.equal(1);
                    chai_1.expect(loadedPosts[0].categoryIds[1]).to.be.equal(2);
                    chai_1.expect(loadedPosts[0].categories).to.not.be.eql([]);
                    chai_1.expect(loadedPosts[0].categories.length).to.be.equal(2);
                    chai_1.expect(loadedPosts[0].categories[0].imageIds).to.not.be.eql([]);
                    chai_1.expect(loadedPosts[0].categories[0].imageIds.length).to.be.equal(2);
                    chai_1.expect(loadedPosts[0].categories[0].imageIds[0]).to.be.equal(1);
                    chai_1.expect(loadedPosts[0].categories[0].imageIds[1]).to.be.equal(2);
                    chai_1.expect(loadedPosts[0].categories[1].imageIds).to.not.be.eql([]);
                    chai_1.expect(loadedPosts[0].categories[1].imageIds.length).to.be.equal(1);
                    chai_1.expect(loadedPosts[0].categories[1].imageIds[0]).to.be.equal(3);
                    chai_1.expect(loadedPosts[1].categoryIds).to.not.be.eql([]);
                    chai_1.expect(loadedPosts[1].categoryIds.length).to.be.equal(2);
                    chai_1.expect(loadedPosts[1].categoryIds[0]).to.be.equal(3);
                    chai_1.expect(loadedPosts[1].categoryIds[1]).to.be.equal(4);
                    chai_1.expect(loadedPosts[1].categories).to.not.be.eql([]);
                    chai_1.expect(loadedPosts[1].categories.length).to.be.equal(2);
                    chai_1.expect(loadedPosts[1].categories[0].imageIds).to.not.be.eql([]);
                    chai_1.expect(loadedPosts[1].categories[0].imageIds.length).to.be.equal(2);
                    chai_1.expect(loadedPosts[1].categories[0].imageIds[0]).to.be.equal(4);
                    chai_1.expect(loadedPosts[1].categories[0].imageIds[1]).to.be.equal(5);
                    chai_1.expect(loadedPosts[1].categories[1].imageIds).to.be.eql([]);
                    return [4 /*yield*/, connection.manager
                            .createQueryBuilder(Post_1.Post, "post")
                            .loadRelationIdAndMap("post.categoryIds", "post.categories")
                            .leftJoinAndSelect("post.categories", "category")
                            .loadRelationIdAndMap("category.imageIds", "category.images")
                            .where("post.id = :id", { id: 1 })
                            .orderBy("category.id")
                            .getOne()];
                case 13:
                    loadedPost = _a.sent();
                    chai_1.expect(loadedPost.categoryIds).to.not.be.eql([]);
                    chai_1.expect(loadedPost.categoryIds.length).to.be.equal(2);
                    chai_1.expect(loadedPost.categoryIds[0]).to.be.equal(1);
                    chai_1.expect(loadedPost.categoryIds[1]).to.be.equal(2);
                    chai_1.expect(loadedPost.categories).to.not.be.eql([]);
                    chai_1.expect(loadedPost.categories.length).to.be.equal(2);
                    chai_1.expect(loadedPost.categories[0].imageIds).to.not.be.eql([]);
                    chai_1.expect(loadedPost.categories[0].imageIds.length).to.be.equal(2);
                    chai_1.expect(loadedPost.categories[0].imageIds[0]).to.be.equal(1);
                    chai_1.expect(loadedPost.categories[0].imageIds[1]).to.be.equal(2);
                    chai_1.expect(loadedPost.categories[1].imageIds).to.not.be.eql([]);
                    chai_1.expect(loadedPost.categories[1].imageIds.length).to.be.equal(1);
                    chai_1.expect(loadedPost.categories[1].imageIds[0]).to.be.equal(3);
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=basic-functionality.js.map