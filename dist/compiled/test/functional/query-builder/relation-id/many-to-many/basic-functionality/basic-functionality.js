"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var chai_1 = require("chai");
var test_utils_1 = require("../../../../../utils/test-utils");
var Tag_1 = require("./entity/Tag");
var Post_1 = require("./entity/Post");
var Category_1 = require("./entity/Category");
var Image_1 = require("./entity/Image");
describe("query builder > relation-id > many-to-many > basic-functionality", function () {
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
    it("should not load ids when RelationId decorator is not specified", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var tag, category1, category2, category3, post, post2, loadedPosts, loadedPost;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    tag = new Tag_1.Tag();
                    tag.name = "kids";
                    return [4 /*yield*/, connection.manager.save(tag)];
                case 1:
                    _a.sent();
                    category1 = new Category_1.Category();
                    category1.name = "kids";
                    return [4 /*yield*/, connection.manager.save(category1)];
                case 2:
                    _a.sent();
                    category2 = new Category_1.Category();
                    category2.name = "future";
                    return [4 /*yield*/, connection.manager.save(category2)];
                case 3:
                    _a.sent();
                    category3 = new Category_1.Category();
                    category3.name = "cars";
                    return [4 /*yield*/, connection.manager.save(category3)];
                case 4:
                    _a.sent();
                    post = new Post_1.Post();
                    post.title = "about kids";
                    post.categories = [category1, category2];
                    post.tag = tag;
                    return [4 /*yield*/, connection.manager.save(post)];
                case 5:
                    _a.sent();
                    post2 = new Post_1.Post();
                    post2.title = "about BMW";
                    post2.categories = [category3];
                    post2.tag = tag;
                    return [4 /*yield*/, connection.manager.save(post2)];
                case 6:
                    _a.sent();
                    return [4 /*yield*/, connection.manager
                            .createQueryBuilder(Post_1.Post, "post")
                            .leftJoinAndSelect("post.tag", "tag")
                            .leftJoinAndSelect("post.categories", "categories")
                            .addOrderBy("post.id, tag.id, categories.id")
                            .getMany()];
                case 7:
                    loadedPosts = _a.sent();
                    chai_1.expect(loadedPosts[0].tag).to.not.be.undefined;
                    chai_1.expect(loadedPosts[0].tagId).to.be.undefined;
                    chai_1.expect(loadedPosts[0].categories).to.not.be.eql([]);
                    chai_1.expect(loadedPosts[0].categoryIds).to.be.undefined;
                    chai_1.expect(loadedPosts[1].tag).to.not.be.undefined;
                    chai_1.expect(loadedPosts[1].tagId).to.be.undefined;
                    chai_1.expect(loadedPosts[1].categories).to.not.be.eql([]);
                    chai_1.expect(loadedPosts[1].categoryIds).to.be.undefined;
                    return [4 /*yield*/, connection.manager
                            .createQueryBuilder(Post_1.Post, "post")
                            .leftJoinAndSelect("post.tag", "tag")
                            .leftJoinAndSelect("post.categories", "categories")
                            .addOrderBy("post.id, tag.id, categories.id")
                            .where("post.id = :id", { id: post.id })
                            .getOne()];
                case 8:
                    loadedPost = _a.sent();
                    chai_1.expect(loadedPost.tag).to.not.be.undefined;
                    chai_1.expect(loadedPost.tagId).to.be.undefined;
                    chai_1.expect(loadedPost.categories).to.not.be.eql([]);
                    chai_1.expect(loadedPost.categoryIds).to.be.undefined;
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should load ids when loadRelationIdAndMap used on ManyToMany owner side", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var category1, category2, post, post2, loadedPosts, loadedPost;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    category1 = new Category_1.Category();
                    category1.name = "kids";
                    return [4 /*yield*/, connection.manager.save(category1)];
                case 1:
                    _a.sent();
                    category2 = new Category_1.Category();
                    category2.name = "future";
                    return [4 /*yield*/, connection.manager.save(category2)];
                case 2:
                    _a.sent();
                    post = new Post_1.Post();
                    post.title = "about kids";
                    post.categories = [category1, category2];
                    return [4 /*yield*/, connection.manager.save(post)];
                case 3:
                    _a.sent();
                    post2 = new Post_1.Post();
                    post2.title = "about kids";
                    post2.categories = [category1, category2];
                    return [4 /*yield*/, connection.manager.save(post2)];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, connection.manager
                            .createQueryBuilder(Post_1.Post, "post")
                            .loadRelationIdAndMap("post.categoryIds", "post.categories")
                            .getMany()];
                case 5:
                    loadedPosts = _a.sent();
                    chai_1.expect(loadedPosts[0].categoryIds).to.not.be.undefined;
                    chai_1.expect(loadedPosts[0].categoryIds[0]).to.be.equal(1);
                    chai_1.expect(loadedPosts[0].categoryIds[1]).to.be.equal(2);
                    chai_1.expect(loadedPosts[1].categoryIds).to.not.be.undefined;
                    chai_1.expect(loadedPosts[1].categoryIds[0]).to.be.equal(1);
                    chai_1.expect(loadedPosts[1].categoryIds[1]).to.be.equal(2);
                    return [4 /*yield*/, connection.manager
                            .createQueryBuilder(Post_1.Post, "post")
                            .loadRelationIdAndMap("post.categoryIds", "post.categories")
                            .where("post.id = :id", { id: post.id })
                            .getOne()];
                case 6:
                    loadedPost = _a.sent();
                    chai_1.expect(loadedPost.categoryIds).to.not.be.undefined;
                    chai_1.expect(loadedPost.categoryIds[0]).to.be.equal(1);
                    chai_1.expect(loadedPost.categoryIds[1]).to.be.equal(2);
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should load ids when loadRelationIdAndMap used on ManyToMany owner side without inverse side", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var category1, category2, post, loadedPost;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    category1 = new Category_1.Category();
                    category1.name = "kids";
                    category2 = new Category_1.Category();
                    category2.name = "future";
                    return [4 /*yield*/, Promise.all([
                            connection.manager.save(category1),
                            connection.manager.save(category2)
                        ])];
                case 1:
                    _a.sent();
                    post = new Post_1.Post();
                    post.title = "about kids";
                    post.subcategories = [category1, category2];
                    return [4 /*yield*/, connection.manager.save(post)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, connection.manager
                            .createQueryBuilder(Post_1.Post, "post")
                            .loadRelationIdAndMap("post.categoryIds", "post.subcategories")
                            .where("post.id = :id", { id: post.id })
                            .getOne()];
                case 3:
                    loadedPost = _a.sent();
                    chai_1.expect(loadedPost.categoryIds).to.not.be.undefined;
                    chai_1.expect(loadedPost.categoryIds[0]).to.be.equal(1);
                    chai_1.expect(loadedPost.categoryIds[1]).to.be.equal(2);
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should load ids when loadRelationIdAndMap used on ManyToMany inverse side", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var category, post1, post2, loadedCategory;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    category = new Category_1.Category();
                    category.name = "cars";
                    return [4 /*yield*/, connection.manager.save(category)];
                case 1:
                    _a.sent();
                    post1 = new Post_1.Post();
                    post1.title = "about BMW";
                    post1.categories = [category];
                    post2 = new Post_1.Post();
                    post2.title = "about Audi";
                    post2.categories = [category];
                    return [4 /*yield*/, Promise.all([
                            connection.manager.save(post1),
                            connection.manager.save(post2)
                        ])];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, connection.manager
                            .createQueryBuilder(Category_1.Category, "category")
                            .loadRelationIdAndMap("category.postIds", "category.posts")
                            .where("category.id = :id", { id: category.id })
                            .getOne()];
                case 3:
                    loadedCategory = _a.sent();
                    chai_1.expect(loadedCategory.postIds).to.not.be.undefined;
                    chai_1.expect(loadedCategory.postIds[0]).to.be.equal(1);
                    chai_1.expect(loadedCategory.postIds[1]).to.be.equal(2);
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should load ids when loadRelationIdAndMap used on ManyToMany owning side with additional condition", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var category1, category2, post, loadedPost;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    category1 = new Category_1.Category();
                    category1.name = "kids";
                    category2 = new Category_1.Category();
                    category2.name = "future";
                    return [4 /*yield*/, Promise.all([
                            connection.manager.save(category1),
                            connection.manager.save(category2)
                        ])];
                case 1:
                    _a.sent();
                    post = new Post_1.Post();
                    post.title = "about kids";
                    post.categories = [category1, category2];
                    return [4 /*yield*/, connection.manager.save(post)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, connection.manager
                            .createQueryBuilder(Post_1.Post, "post")
                            .loadRelationIdAndMap("post.categoryIds", "post.categories", "categories", function (qb) { return qb.andWhere("categories.id = :categoryId", { categoryId: 1 }); })
                            .getOne()];
                case 3:
                    loadedPost = _a.sent();
                    chai_1.expect(loadedPost.categoryIds).to.not.be.undefined;
                    chai_1.expect(loadedPost.categoryIds.length).to.be.equal(1);
                    chai_1.expect(loadedPost.categoryIds[0]).to.be.equal(1);
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should load ids when loadRelationIdAndMap used on ManyToMany owning side without inverse side and with additional condition", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var category1, category2, post, loadedPost;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    category1 = new Category_1.Category();
                    category1.name = "kids";
                    category2 = new Category_1.Category();
                    category2.name = "future";
                    return [4 /*yield*/, Promise.all([
                            connection.manager.save(category1),
                            connection.manager.save(category2)
                        ])];
                case 1:
                    _a.sent();
                    post = new Post_1.Post();
                    post.title = "about kids";
                    post.subcategories = [category1, category2];
                    return [4 /*yield*/, connection.manager.save(post)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, connection.manager
                            .createQueryBuilder(Post_1.Post, "post")
                            .loadRelationIdAndMap("post.categoryIds", "post.subcategories", "subCategories", function (qb) { return qb.andWhere("subCategories.id = :categoryId", { categoryId: 1 }); })
                            .getOne()];
                case 3:
                    loadedPost = _a.sent();
                    chai_1.expect(loadedPost.categoryIds).to.not.be.undefined;
                    chai_1.expect(loadedPost.categoryIds.length).to.be.equal(1);
                    chai_1.expect(loadedPost.categoryIds[0]).to.be.equal(1);
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should load ids when loadRelationIdAndMap used on ManyToMany inverse side with additional condition", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var category, post1, post2, loadedCategory;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    category = new Category_1.Category();
                    category.name = "cars";
                    return [4 /*yield*/, connection.manager.save(category)];
                case 1:
                    _a.sent();
                    post1 = new Post_1.Post();
                    post1.title = "about BMW";
                    post1.categories = [category];
                    post2 = new Post_1.Post();
                    post2.title = "about Audi";
                    post2.categories = [category];
                    return [4 /*yield*/, Promise.all([
                            connection.manager.save(post1),
                            connection.manager.save(post2)
                        ])];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, connection.manager
                            .createQueryBuilder(Category_1.Category, "category")
                            .loadRelationIdAndMap("category.postIds", "category.posts", "posts", function (qb) { return qb.andWhere("posts.id = :postId", { postId: 1 }); })
                            .where("category.id = :id", { id: category.id })
                            .getOne()];
                case 3:
                    loadedCategory = _a.sent();
                    chai_1.expect(loadedCategory.postIds).to.not.be.undefined;
                    chai_1.expect(loadedCategory.postIds.length).to.be.equal(1);
                    chai_1.expect(loadedCategory.postIds[0]).to.be.equal(1);
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should load ids when loadRelationIdAndMap used on nested relation", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var image1, image2, category1, category2, post, loadedPost;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    image1 = new Image_1.Image();
                    image1.name = "photo1";
                    image2 = new Image_1.Image();
                    image2.name = "photo2";
                    return [4 /*yield*/, Promise.all([
                            connection.manager.save(image1),
                            connection.manager.save(image2)
                        ])];
                case 1:
                    _a.sent();
                    category1 = new Category_1.Category();
                    category1.name = "cars";
                    category1.images = [image1, image2];
                    return [4 /*yield*/, connection.manager.save(category1)];
                case 2:
                    _a.sent();
                    category2 = new Category_1.Category();
                    category2.name = "BMW";
                    return [4 /*yield*/, connection.manager.save(category2)];
                case 3:
                    _a.sent();
                    post = new Post_1.Post();
                    post.title = "about BMW";
                    post.categories = [category1, category2];
                    return [4 /*yield*/, connection.manager.save(post)];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, connection.manager
                            .createQueryBuilder(Post_1.Post, "post")
                            .leftJoinAndSelect("post.categories", "categories")
                            .loadRelationIdAndMap("post.categoryIds", "post.categories")
                            .loadRelationIdAndMap("categories.imageIds", "categories.images")
                            .where("post.id = :id", { id: post.id })
                            .addOrderBy("post.id, categories.id")
                            .getOne()];
                case 5:
                    loadedPost = _a.sent();
                    chai_1.expect(loadedPost.categories).to.not.be.eql([]);
                    chai_1.expect(loadedPost.categoryIds).to.not.be.undefined;
                    chai_1.expect(loadedPost.categoryIds.length).to.be.equal(2);
                    chai_1.expect(loadedPost.categoryIds[0]).to.be.equal(1);
                    chai_1.expect(loadedPost.categoryIds[1]).to.be.equal(2);
                    chai_1.expect(loadedPost.categories[0].imageIds).to.not.be.eql([]);
                    chai_1.expect(loadedPost.categories[0].imageIds.length).to.be.equal(2);
                    chai_1.expect(loadedPost.categories[0].imageIds[0]).to.be.equal(1);
                    chai_1.expect(loadedPost.categories[0].imageIds[1]).to.be.equal(2);
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should load ids when loadRelationIdAndMap used on nested relation with additional conditions", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var image1, image2, category1, category2, post, loadedPost;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    image1 = new Image_1.Image();
                    image1.name = "photo1";
                    image2 = new Image_1.Image();
                    image2.name = "photo2";
                    return [4 /*yield*/, Promise.all([
                            connection.manager.save(image1),
                            connection.manager.save(image2)
                        ])];
                case 1:
                    _a.sent();
                    category1 = new Category_1.Category();
                    category1.name = "cars";
                    category1.images = [image1, image2];
                    return [4 /*yield*/, connection.manager.save(category1)];
                case 2:
                    _a.sent();
                    category2 = new Category_1.Category();
                    category2.name = "BMW";
                    return [4 /*yield*/, connection.manager.save(category2)];
                case 3:
                    _a.sent();
                    post = new Post_1.Post();
                    post.title = "about BMW";
                    post.categories = [category1, category2];
                    return [4 /*yield*/, connection.manager.save(post)];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, connection.manager
                            .createQueryBuilder(Post_1.Post, "post")
                            .leftJoinAndSelect("post.categories", "categories")
                            .loadRelationIdAndMap("post.categoryIds", "post.categories", "categories2", function (qb) { return qb.andWhere("categories2.id = :categoryId", { categoryId: 1 }); })
                            .loadRelationIdAndMap("categories.imageIds", "categories.images", "images", function (qb) { return qb.andWhere("images.id = :imageId", { imageId: 1 }); })
                            .where("post.id = :id", { id: post.id })
                            .addOrderBy("post.id, categories.id")
                            .getOne()];
                case 5:
                    loadedPost = _a.sent();
                    chai_1.expect(loadedPost.categories).to.not.be.eql([]);
                    chai_1.expect(loadedPost.categoryIds).to.not.be.undefined;
                    chai_1.expect(loadedPost.categoryIds.length).to.be.equal(1);
                    chai_1.expect(loadedPost.categoryIds[0]).to.be.equal(1);
                    chai_1.expect(loadedPost.categories[0].imageIds).to.not.be.eql([]);
                    chai_1.expect(loadedPost.categories[0].imageIds.length).to.be.equal(1);
                    chai_1.expect(loadedPost.categories[0].imageIds[0]).to.be.equal(1);
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should not load ids of nested relations when loadRelationIdAndMap used on inherit relation and parent relation was not found", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var image1, image2, category1, post, loadedPost;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    image1 = new Image_1.Image();
                    image1.name = "photo1";
                    image2 = new Image_1.Image();
                    image2.name = "photo2";
                    return [4 /*yield*/, Promise.all([
                            connection.manager.save(image1),
                            connection.manager.save(image2)
                        ])];
                case 1:
                    _a.sent();
                    category1 = new Category_1.Category();
                    category1.name = "cars";
                    category1.images = [image1, image2];
                    return [4 /*yield*/, connection.manager.save(category1)];
                case 2:
                    _a.sent();
                    post = new Post_1.Post();
                    post.title = "about BMW";
                    post.categories = [category1];
                    return [4 /*yield*/, connection.manager.save(post)];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, connection.manager
                            .createQueryBuilder(Post_1.Post, "post")
                            .leftJoinAndSelect("post.categories", "categories", "categories.id = :categoryId")
                            .loadRelationIdAndMap("categories.imageIds", "categories.images")
                            .where("post.id = :id", { id: post.id })
                            .setParameter("categoryId", 2)
                            .addOrderBy("post.id, categories.id")
                            .getOne()];
                case 4:
                    loadedPost = _a.sent();
                    chai_1.expect(loadedPost.categories).to.be.eql([]);
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=basic-functionality.js.map