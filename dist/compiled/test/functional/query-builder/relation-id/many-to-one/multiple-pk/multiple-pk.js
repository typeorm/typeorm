"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var chai_1 = require("chai");
var test_utils_1 = require("../../../../../utils/test-utils");
var Post_1 = require("./entity/Post");
var Category_1 = require("./entity/Category");
var Image_1 = require("./entity/Image");
describe("query builder > relation-id > many-to-one > multiple-pk", function () {
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
    it("should load ids when both entities have multiple primary keys", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var category1, category2, post1, post2, post3, loadedPosts, loadedPost;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    category1 = new Category_1.Category();
                    category1.id = 1;
                    category1.code = 1;
                    category1.name = "cars";
                    return [4 /*yield*/, connection.manager.save(category1)];
                case 1:
                    _a.sent();
                    category2 = new Category_1.Category();
                    category2.id = 2;
                    category2.code = 1;
                    category2.name = "airplanes";
                    return [4 /*yield*/, connection.manager.save(category2)];
                case 2:
                    _a.sent();
                    post1 = new Post_1.Post();
                    post1.id = 1;
                    post1.authorId = 1;
                    post1.title = "About BMW";
                    post1.category = category1;
                    return [4 /*yield*/, connection.manager.save(post1)];
                case 3:
                    _a.sent();
                    post2 = new Post_1.Post();
                    post2.id = 2;
                    post2.authorId = 1;
                    post2.title = "About Audi";
                    post2.category = category1;
                    return [4 /*yield*/, connection.manager.save(post2)];
                case 4:
                    _a.sent();
                    post3 = new Post_1.Post();
                    post3.id = 3;
                    post3.authorId = 2;
                    post3.title = "About Boeing";
                    post3.category = category2;
                    return [4 /*yield*/, connection.manager.save(post3)];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, connection.manager
                            .createQueryBuilder(Post_1.Post, "post")
                            .loadRelationIdAndMap("post.categoryId", "post.category")
                            .getMany()];
                case 6:
                    loadedPosts = _a.sent();
                    chai_1.expect(loadedPosts[0].categoryId).to.be.eql({ id: 1, code: 1 });
                    chai_1.expect(loadedPosts[1].categoryId).to.be.eql({ id: 1, code: 1 });
                    chai_1.expect(loadedPosts[2].categoryId).to.be.eql({ id: 2, code: 1 });
                    return [4 /*yield*/, connection.manager
                            .createQueryBuilder(Post_1.Post, "post")
                            .loadRelationIdAndMap("post.categoryId", "post.category")
                            .where("post.id = :id", { id: 1 })
                            .andWhere("post.authorId = :authorId", { authorId: 1 })
                            .getOne()];
                case 7:
                    loadedPost = _a.sent();
                    chai_1.expect(loadedPost.categoryId).to.be.eql({ id: 1, code: 1 });
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should load ids when only one entity have multiple primary keys", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var image1, image2, category1, category2, loadedCategories, loadedCategory;
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
                    category1 = new Category_1.Category();
                    category1.id = 1;
                    category1.code = 1;
                    category1.name = "cars";
                    category1.image = image1;
                    return [4 /*yield*/, connection.manager.save(category1)];
                case 3:
                    _a.sent();
                    category2 = new Category_1.Category();
                    category2.id = 2;
                    category2.code = 2;
                    category2.name = "airplanes";
                    category2.image = image2;
                    return [4 /*yield*/, connection.manager.save(category2)];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, connection.manager
                            .createQueryBuilder(Category_1.Category, "category")
                            .loadRelationIdAndMap("category.imageId", "category.image")
                            .getMany()];
                case 5:
                    loadedCategories = _a.sent();
                    chai_1.expect(loadedCategories[0].imageId).to.be.equal(1);
                    chai_1.expect(loadedCategories[1].imageId).to.be.equal(2);
                    return [4 /*yield*/, connection.manager
                            .createQueryBuilder(Category_1.Category, "category")
                            .loadRelationIdAndMap("category.imageId", "category.image")
                            .where("category.id = :id", { id: 1 })
                            .andWhere("category.code = :code", { code: 1 })
                            .getOne()];
                case 6:
                    loadedCategory = _a.sent();
                    chai_1.expect(loadedCategory.imageId).to.be.equal(1);
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should load ids when both entities have multiple primary keys and related entity does not have inverse side", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var category1, category2, post1, post2, post3, loadedPosts, loadedPost;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    category1 = new Category_1.Category();
                    category1.id = 1;
                    category1.code = 1;
                    category1.name = "cars";
                    return [4 /*yield*/, connection.manager.save(category1)];
                case 1:
                    _a.sent();
                    category2 = new Category_1.Category();
                    category2.id = 2;
                    category2.code = 1;
                    category2.name = "airplanes";
                    return [4 /*yield*/, connection.manager.save(category2)];
                case 2:
                    _a.sent();
                    post1 = new Post_1.Post();
                    post1.id = 1;
                    post1.authorId = 1;
                    post1.title = "About BMW";
                    post1.subcategory = category1;
                    return [4 /*yield*/, connection.manager.save(post1)];
                case 3:
                    _a.sent();
                    post2 = new Post_1.Post();
                    post2.id = 2;
                    post2.authorId = 1;
                    post2.title = "About Audi";
                    post2.subcategory = category1;
                    return [4 /*yield*/, connection.manager.save(post2)];
                case 4:
                    _a.sent();
                    post3 = new Post_1.Post();
                    post3.id = 3;
                    post3.authorId = 2;
                    post3.title = "About Boeing";
                    post3.subcategory = category2;
                    return [4 /*yield*/, connection.manager.save(post3)];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, connection.manager
                            .createQueryBuilder(Post_1.Post, "post")
                            .loadRelationIdAndMap("post.categoryId", "post.subcategory")
                            .getMany()];
                case 6:
                    loadedPosts = _a.sent();
                    chai_1.expect(loadedPosts[0].categoryId).to.be.eql({ id: 1, code: 1 });
                    chai_1.expect(loadedPosts[1].categoryId).to.be.eql({ id: 1, code: 1 });
                    chai_1.expect(loadedPosts[2].categoryId).to.be.eql({ id: 2, code: 1 });
                    return [4 /*yield*/, connection.manager
                            .createQueryBuilder(Post_1.Post, "post")
                            .loadRelationIdAndMap("post.categoryId", "post.subcategory")
                            .where("post.id = :id", { id: 1 })
                            .andWhere("post.authorId = :authorId", { authorId: 1 })
                            .getOne()];
                case 7:
                    loadedPost = _a.sent();
                    chai_1.expect(loadedPost.categoryId).to.be.eql({ id: 1, code: 1 });
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should load ids when loadRelationIdAndMap used on nested relation", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var image1, image2, category1, category2, post1, post2, loadedPosts, loadedPost;
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
                    category1 = new Category_1.Category();
                    category1.id = 1;
                    category1.code = 1;
                    category1.name = "cars";
                    category1.image = image1;
                    return [4 /*yield*/, connection.manager.save(category1)];
                case 3:
                    _a.sent();
                    category2 = new Category_1.Category();
                    category2.id = 2;
                    category2.code = 1;
                    category2.name = "airplanes";
                    category2.image = image2;
                    return [4 /*yield*/, connection.manager.save(category2)];
                case 4:
                    _a.sent();
                    post1 = new Post_1.Post();
                    post1.id = 1;
                    post1.authorId = 1;
                    post1.title = "About BMW";
                    post1.category = category1;
                    return [4 /*yield*/, connection.manager.save(post1)];
                case 5:
                    _a.sent();
                    post2 = new Post_1.Post();
                    post2.id = 2;
                    post2.authorId = 1;
                    post2.title = "About Boeing";
                    post2.category = category2;
                    return [4 /*yield*/, connection.manager.save(post2)];
                case 6:
                    _a.sent();
                    return [4 /*yield*/, connection.manager
                            .createQueryBuilder(Post_1.Post, "post")
                            .loadRelationIdAndMap("post.categoryId", "post.category")
                            .leftJoinAndSelect("post.category", "category")
                            .loadRelationIdAndMap("category.imageId", "category.image")
                            .getMany()];
                case 7:
                    loadedPosts = _a.sent();
                    chai_1.expect(loadedPosts[0].categoryId).to.be.eql({ id: 1, code: 1 });
                    chai_1.expect(loadedPosts[0].category.imageId).to.be.equal(1);
                    chai_1.expect(loadedPosts[1].categoryId).to.be.eql({ id: 2, code: 1 });
                    chai_1.expect(loadedPosts[1].category.imageId).to.be.equal(2);
                    return [4 /*yield*/, connection.manager
                            .createQueryBuilder(Post_1.Post, "post")
                            .loadRelationIdAndMap("post.categoryId", "post.category")
                            .leftJoinAndSelect("post.category", "category")
                            .loadRelationIdAndMap("category.imageId", "category.image")
                            .where("post.id = :id", { id: 1 })
                            .andWhere("post.authorId = :authorId", { authorId: 1 })
                            .getOne()];
                case 8:
                    loadedPost = _a.sent();
                    chai_1.expect(loadedPost.categoryId).to.be.eql({ id: 1, code: 1 });
                    chai_1.expect(loadedPost.category.imageId).to.be.equal(1);
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=multiple-pk.js.map