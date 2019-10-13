"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var chai_1 = require("chai");
var test_utils_1 = require("../../../utils/test-utils");
var Post_1 = require("./entity/Post");
var Category_1 = require("./entity/Category");
var Tag_1 = require("./entity/Tag");
describe("relations > custom-referenced-column-name", function () {
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
    describe("many-to-one", function () {
        it("should load related entity when relation use custom referenced column name", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var category1, category2, post1, post2, loadedPosts, loadedPost;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        category1 = new Category_1.Category();
                        category1.name = "cars";
                        return [4 /*yield*/, connection.manager.save(category1)];
                    case 1:
                        _a.sent();
                        category2 = new Category_1.Category();
                        category2.name = "airplanes";
                        return [4 /*yield*/, connection.manager.save(category2)];
                    case 2:
                        _a.sent();
                        post1 = new Post_1.Post();
                        post1.title = "About BMW";
                        post1.category = category1;
                        return [4 /*yield*/, connection.manager.save(post1)];
                    case 3:
                        _a.sent();
                        post2 = new Post_1.Post();
                        post2.title = "About Boeing";
                        post2.category = category2;
                        return [4 /*yield*/, connection.manager.save(post2)];
                    case 4:
                        _a.sent();
                        return [4 /*yield*/, connection.manager
                                .createQueryBuilder(Post_1.Post, "post")
                                .getMany()];
                    case 5:
                        loadedPosts = _a.sent();
                        chai_1.expect(loadedPosts[0].categoryName).to.not.be.undefined;
                        chai_1.expect(loadedPosts[0].categoryName).to.be.equal("cars");
                        chai_1.expect(loadedPosts[1].categoryName).to.not.be.undefined;
                        chai_1.expect(loadedPosts[1].categoryName).to.be.equal("airplanes");
                        return [4 /*yield*/, connection.manager
                                .createQueryBuilder(Post_1.Post, "post")
                                .where("post.id = :id", { id: 1 })
                                .getOne()];
                    case 6:
                        loadedPost = _a.sent();
                        chai_1.expect(loadedPost.categoryName).to.not.be.undefined;
                        chai_1.expect(loadedPost.categoryName).to.be.equal("cars");
                        return [2 /*return*/];
                }
            });
        }); })); });
        it("should load related entity when relation defined with empty join column", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var category1, category2, post1, post2, loadedPosts, loadedPost;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        category1 = new Category_1.Category();
                        category1.name = "cars";
                        return [4 /*yield*/, connection.manager.save(category1)];
                    case 1:
                        _a.sent();
                        category2 = new Category_1.Category();
                        category2.name = "airplanes";
                        return [4 /*yield*/, connection.manager.save(category2)];
                    case 2:
                        _a.sent();
                        post1 = new Post_1.Post();
                        post1.title = "About BMW";
                        post1.categoryWithEmptyJoinCol = category1;
                        return [4 /*yield*/, connection.manager.save(post1)];
                    case 3:
                        _a.sent();
                        post2 = new Post_1.Post();
                        post2.title = "About Boeing";
                        post2.categoryWithEmptyJoinCol = category2;
                        return [4 /*yield*/, connection.manager.save(post2)];
                    case 4:
                        _a.sent();
                        return [4 /*yield*/, connection.manager
                                .createQueryBuilder(Post_1.Post, "post")
                                .leftJoinAndSelect("post.categoryWithEmptyJoinCol", "categoryWithEmptyJoinCol")
                                .getMany()];
                    case 5:
                        loadedPosts = _a.sent();
                        chai_1.expect(loadedPosts[0].categoryWithEmptyJoinCol.id).to.be.equal(1);
                        chai_1.expect(loadedPosts[1].categoryWithEmptyJoinCol.id).to.be.equal(2);
                        return [4 /*yield*/, connection.manager
                                .createQueryBuilder(Post_1.Post, "post")
                                .where("post.id = :id", { id: 1 })
                                .leftJoinAndSelect("post.categoryWithEmptyJoinCol", "categoryWithEmptyJoinCol")
                                .getOne()];
                    case 6:
                        loadedPost = _a.sent();
                        chai_1.expect(loadedPost.categoryWithEmptyJoinCol.id).to.be.equal(1);
                        return [2 /*return*/];
                }
            });
        }); })); });
        it("should load related entity when relation defined without reference column name", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var category1, category2, post1, post2, loadedPosts, loadedPost;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        category1 = new Category_1.Category();
                        category1.name = "cars";
                        return [4 /*yield*/, connection.manager.save(category1)];
                    case 1:
                        _a.sent();
                        category2 = new Category_1.Category();
                        category2.name = "airplanes";
                        return [4 /*yield*/, connection.manager.save(category2)];
                    case 2:
                        _a.sent();
                        post1 = new Post_1.Post();
                        post1.title = "About BMW";
                        post1.categoryWithoutRefColName = category1;
                        return [4 /*yield*/, connection.manager.save(post1)];
                    case 3:
                        _a.sent();
                        post2 = new Post_1.Post();
                        post2.title = "About Boeing";
                        post2.categoryWithoutRefColName = category2;
                        return [4 /*yield*/, connection.manager.save(post2)];
                    case 4:
                        _a.sent();
                        return [4 /*yield*/, connection.manager
                                .createQueryBuilder(Post_1.Post, "post")
                                .getMany()];
                    case 5:
                        loadedPosts = _a.sent();
                        chai_1.expect(loadedPosts[0].categoryId).to.be.equal(1);
                        chai_1.expect(loadedPosts[1].categoryId).to.be.equal(2);
                        return [4 /*yield*/, connection.manager
                                .createQueryBuilder(Post_1.Post, "post")
                                .where("post.id = :id", { id: 1 })
                                .getOne()];
                    case 6:
                        loadedPost = _a.sent();
                        chai_1.expect(loadedPost.categoryId).to.be.equal(1);
                        return [2 /*return*/];
                }
            });
        }); })); });
        it("should load related entity when relation defined without column name", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var category1, category2, post1, post2, loadedPosts, loadedPost;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        category1 = new Category_1.Category();
                        category1.name = "cars";
                        return [4 /*yield*/, connection.manager.save(category1)];
                    case 1:
                        _a.sent();
                        category2 = new Category_1.Category();
                        category2.name = "airplanes";
                        return [4 /*yield*/, connection.manager.save(category2)];
                    case 2:
                        _a.sent();
                        post1 = new Post_1.Post();
                        post1.title = "About BMW";
                        post1.categoryWithoutColName = category1;
                        return [4 /*yield*/, connection.manager.save(post1)];
                    case 3:
                        _a.sent();
                        post2 = new Post_1.Post();
                        post2.title = "About Boeing";
                        post2.categoryWithoutColName = category2;
                        return [4 /*yield*/, connection.manager.save(post2)];
                    case 4:
                        _a.sent();
                        return [4 /*yield*/, connection.manager
                                .createQueryBuilder(Post_1.Post, "post")
                                .leftJoinAndSelect("post.categoryWithoutColName", "categoryWithoutColName")
                                .getMany()];
                    case 5:
                        loadedPosts = _a.sent();
                        chai_1.expect(loadedPosts[0].categoryWithoutColName.id).to.be.equal(1);
                        chai_1.expect(loadedPosts[1].categoryWithoutColName.id).to.be.equal(2);
                        return [4 /*yield*/, connection.manager
                                .createQueryBuilder(Post_1.Post, "post")
                                .leftJoinAndSelect("post.categoryWithoutColName", "categoryWithoutColName")
                                .where("post.id = :id", { id: 1 })
                                .getOne()];
                    case 6:
                        loadedPost = _a.sent();
                        chai_1.expect(loadedPost.categoryWithoutColName.id).to.be.equal(1);
                        return [2 /*return*/];
                }
            });
        }); })); });
        it("should load related entity when relation defined without reference column name and relation does not have relation column in entity", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var category1, category2, post1, post2, loadedPosts, loadedPost;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        category1 = new Category_1.Category();
                        category1.name = "cars";
                        return [4 /*yield*/, connection.manager.save(category1)];
                    case 1:
                        _a.sent();
                        category2 = new Category_1.Category();
                        category2.name = "airplanes";
                        return [4 /*yield*/, connection.manager.save(category2)];
                    case 2:
                        _a.sent();
                        post1 = new Post_1.Post();
                        post1.title = "About BMW";
                        post1.categoryWithoutRefColName2 = category1;
                        return [4 /*yield*/, connection.manager.save(post1)];
                    case 3:
                        _a.sent();
                        post2 = new Post_1.Post();
                        post2.title = "About Boeing";
                        post2.categoryWithoutRefColName2 = category2;
                        return [4 /*yield*/, connection.manager.save(post2)];
                    case 4:
                        _a.sent();
                        return [4 /*yield*/, connection.manager
                                .createQueryBuilder(Post_1.Post, "post")
                                .leftJoinAndSelect("post.categoryWithoutRefColName2", "categoryWithoutRefColName2")
                                .getMany()];
                    case 5:
                        loadedPosts = _a.sent();
                        chai_1.expect(loadedPosts[0].categoryWithoutRefColName2).to.not.be.undefined;
                        chai_1.expect(loadedPosts[0].categoryWithoutRefColName2.id).to.be.equal(1);
                        chai_1.expect(loadedPosts[1].categoryWithoutRefColName2).to.not.be.undefined;
                        chai_1.expect(loadedPosts[1].categoryWithoutRefColName2.id).to.be.equal(2);
                        return [4 /*yield*/, connection.manager
                                .createQueryBuilder(Post_1.Post, "post")
                                .leftJoinAndSelect("post.categoryWithoutRefColName2", "categoryWithoutRefColName2")
                                .where("post.id = :id", { id: 1 })
                                .getOne()];
                    case 6:
                        loadedPost = _a.sent();
                        chai_1.expect(loadedPost.categoryWithoutRefColName2).to.not.be.undefined;
                        chai_1.expect(loadedPost.categoryWithoutRefColName2.id).to.be.equal(1);
                        return [2 /*return*/];
                }
            });
        }); })); });
        it("should persist relation when relation sets via join column", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var category1, category2, post1, post2, loadedPosts, loadedPost;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        category1 = new Category_1.Category();
                        category1.name = "cars";
                        return [4 /*yield*/, connection.manager.save(category1)];
                    case 1:
                        _a.sent();
                        category2 = new Category_1.Category();
                        category2.name = "airplanes";
                        return [4 /*yield*/, connection.manager.save(category2)];
                    case 2:
                        _a.sent();
                        post1 = new Post_1.Post();
                        post1.title = "About BMW";
                        post1.categoryName = "cars";
                        return [4 /*yield*/, connection.manager.save(post1)];
                    case 3:
                        _a.sent();
                        post2 = new Post_1.Post();
                        post2.title = "About Boeing";
                        post2.categoryName = "airplanes";
                        return [4 /*yield*/, connection.manager.save(post2)];
                    case 4:
                        _a.sent();
                        return [4 /*yield*/, connection.manager
                                .createQueryBuilder(Post_1.Post, "post")
                                .leftJoinAndSelect("post.category", "category")
                                .getMany()];
                    case 5:
                        loadedPosts = _a.sent();
                        chai_1.expect(loadedPosts[0].category).to.not.be.undefined;
                        chai_1.expect(loadedPosts[0].category.id).to.be.equal(1);
                        chai_1.expect(loadedPosts[1].category).to.not.be.undefined;
                        chai_1.expect(loadedPosts[1].category.id).to.be.equal(2);
                        return [4 /*yield*/, connection.manager
                                .createQueryBuilder(Post_1.Post, "post")
                                .leftJoinAndSelect("post.category", "category")
                                .where("post.id = :id", { id: 1 })
                                .getOne()];
                    case 6:
                        loadedPost = _a.sent();
                        chai_1.expect(loadedPost.category).to.not.be.undefined;
                        chai_1.expect(loadedPost.category.id).to.be.equal(1);
                        return [2 /*return*/];
                }
            });
        }); })); });
    });
    describe("one-to-one", function () {
        it("should load related entity when relation use custom referenced column name", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var tag1, tag2, post1, post2, loadedPosts, loadedPost;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        tag1 = new Tag_1.Tag();
                        tag1.name = "tag #1";
                        return [4 /*yield*/, connection.manager.save(tag1)];
                    case 1:
                        _a.sent();
                        tag2 = new Tag_1.Tag();
                        tag2.name = "tag #2";
                        return [4 /*yield*/, connection.manager.save(tag2)];
                    case 2:
                        _a.sent();
                        post1 = new Post_1.Post();
                        post1.title = "Post #1";
                        post1.tag = tag1;
                        return [4 /*yield*/, connection.manager.save(post1)];
                    case 3:
                        _a.sent();
                        post2 = new Post_1.Post();
                        post2.title = "Post #2";
                        post2.tag = tag2;
                        return [4 /*yield*/, connection.manager.save(post2)];
                    case 4:
                        _a.sent();
                        return [4 /*yield*/, connection.manager
                                .createQueryBuilder(Post_1.Post, "post")
                                .getMany()];
                    case 5:
                        loadedPosts = _a.sent();
                        chai_1.expect(loadedPosts[0].tagName).to.not.be.undefined;
                        chai_1.expect(loadedPosts[0].tagName).to.be.equal("tag #1");
                        chai_1.expect(loadedPosts[1].tagName).to.not.be.undefined;
                        chai_1.expect(loadedPosts[1].tagName).to.be.equal("tag #2");
                        return [4 /*yield*/, connection.manager
                                .createQueryBuilder(Post_1.Post, "post")
                                .where("post.id = :id", { id: 1 })
                                .getOne()];
                    case 6:
                        loadedPost = _a.sent();
                        chai_1.expect(loadedPost.tagName).to.not.be.undefined;
                        chai_1.expect(loadedPost.tagName).to.be.equal("tag #1");
                        return [2 /*return*/];
                }
            });
        }); })); });
        it("should load related entity when relation defined without column name", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var tag1, tag2, post1, post2, loadedPosts, loadedPost;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        tag1 = new Tag_1.Tag();
                        tag1.name = "tag #1";
                        return [4 /*yield*/, connection.manager.save(tag1)];
                    case 1:
                        _a.sent();
                        tag2 = new Tag_1.Tag();
                        tag2.name = "tag #2";
                        return [4 /*yield*/, connection.manager.save(tag2)];
                    case 2:
                        _a.sent();
                        post1 = new Post_1.Post();
                        post1.title = "About BMW";
                        post1.tagWithEmptyJoinCol = tag1;
                        return [4 /*yield*/, connection.manager.save(post1)];
                    case 3:
                        _a.sent();
                        post2 = new Post_1.Post();
                        post2.title = "About Boeing";
                        post2.tagWithEmptyJoinCol = tag2;
                        return [4 /*yield*/, connection.manager.save(post2)];
                    case 4:
                        _a.sent();
                        return [4 /*yield*/, connection.manager
                                .createQueryBuilder(Post_1.Post, "post")
                                .leftJoinAndSelect("post.tagWithEmptyJoinCol", "tagWithEmptyJoinCol")
                                .getMany()];
                    case 5:
                        loadedPosts = _a.sent();
                        chai_1.expect(loadedPosts[0].tagWithEmptyJoinCol.id).to.be.equal(1);
                        chai_1.expect(loadedPosts[1].tagWithEmptyJoinCol.id).to.be.equal(2);
                        return [4 /*yield*/, connection.manager
                                .createQueryBuilder(Post_1.Post, "post")
                                .leftJoinAndSelect("post.tagWithEmptyJoinCol", "tagWithEmptyJoinCol")
                                .where("post.id = :id", { id: 1 })
                                .getOne()];
                    case 6:
                        loadedPost = _a.sent();
                        chai_1.expect(loadedPost.tagWithEmptyJoinCol.id).to.be.equal(1);
                        return [2 /*return*/];
                }
            });
        }); })); });
        it("should load related entity when relation defined without reference column name", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var tag1, tag2, post1, post2, loadedPosts, loadedPost;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        tag1 = new Tag_1.Tag();
                        tag1.name = "tag #1";
                        return [4 /*yield*/, connection.manager.save(tag1)];
                    case 1:
                        _a.sent();
                        tag2 = new Tag_1.Tag();
                        tag2.name = "tag #2";
                        return [4 /*yield*/, connection.manager.save(tag2)];
                    case 2:
                        _a.sent();
                        post1 = new Post_1.Post();
                        post1.title = "About BMW";
                        post1.tagWithoutRefColName = tag1;
                        return [4 /*yield*/, connection.manager.save(post1)];
                    case 3:
                        _a.sent();
                        post2 = new Post_1.Post();
                        post2.title = "About Boeing";
                        post2.tagWithoutRefColName = tag2;
                        return [4 /*yield*/, connection.manager.save(post2)];
                    case 4:
                        _a.sent();
                        return [4 /*yield*/, connection.manager
                                .createQueryBuilder(Post_1.Post, "post")
                                .getMany()];
                    case 5:
                        loadedPosts = _a.sent();
                        chai_1.expect(loadedPosts[0].tagId).to.be.equal(1);
                        chai_1.expect(loadedPosts[1].tagId).to.be.equal(2);
                        return [4 /*yield*/, connection.manager
                                .createQueryBuilder(Post_1.Post, "post")
                                .where("post.id = :id", { id: 1 })
                                .getOne()];
                    case 6:
                        loadedPost = _a.sent();
                        chai_1.expect(loadedPost.tagId).to.be.equal(1);
                        return [2 /*return*/];
                }
            });
        }); })); });
        it("should load related entity when relation defined without column name", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var tag1, tag2, post1, post2, loadedPosts, loadedPost;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        tag1 = new Tag_1.Tag();
                        tag1.name = "tag #1";
                        return [4 /*yield*/, connection.manager.save(tag1)];
                    case 1:
                        _a.sent();
                        tag2 = new Tag_1.Tag();
                        tag2.name = "tag #2";
                        return [4 /*yield*/, connection.manager.save(tag2)];
                    case 2:
                        _a.sent();
                        post1 = new Post_1.Post();
                        post1.title = "About BMW";
                        post1.tagWithoutColName = tag1;
                        return [4 /*yield*/, connection.manager.save(post1)];
                    case 3:
                        _a.sent();
                        post2 = new Post_1.Post();
                        post2.title = "About Boeing";
                        post2.tagWithoutColName = tag2;
                        return [4 /*yield*/, connection.manager.save(post2)];
                    case 4:
                        _a.sent();
                        return [4 /*yield*/, connection.manager
                                .createQueryBuilder(Post_1.Post, "post")
                                .leftJoinAndSelect("post.tagWithoutColName", "tagWithoutColName")
                                .getMany()];
                    case 5:
                        loadedPosts = _a.sent();
                        chai_1.expect(loadedPosts[0].tagWithoutColName.id).to.be.equal(1);
                        chai_1.expect(loadedPosts[1].tagWithoutColName.id).to.be.equal(2);
                        return [4 /*yield*/, connection.manager
                                .createQueryBuilder(Post_1.Post, "post")
                                .leftJoinAndSelect("post.tagWithoutColName", "tagWithoutColName")
                                .where("post.id = :id", { id: 1 })
                                .getOne()];
                    case 6:
                        loadedPost = _a.sent();
                        chai_1.expect(loadedPost.tagWithoutColName.id).to.be.equal(1);
                        return [2 /*return*/];
                }
            });
        }); })); });
        it("should load related entity when relation defined without reference column name and relation does not have relation column in entity", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var tag1, tag2, post1, post2, loadedPosts, loadedPost;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        tag1 = new Tag_1.Tag();
                        tag1.name = "tag #1";
                        return [4 /*yield*/, connection.manager.save(tag1)];
                    case 1:
                        _a.sent();
                        tag2 = new Tag_1.Tag();
                        tag2.name = "tag #2";
                        return [4 /*yield*/, connection.manager.save(tag2)];
                    case 2:
                        _a.sent();
                        post1 = new Post_1.Post();
                        post1.title = "About BMW";
                        post1.tagWithoutRefColName2 = tag1;
                        return [4 /*yield*/, connection.manager.save(post1)];
                    case 3:
                        _a.sent();
                        post2 = new Post_1.Post();
                        post2.title = "About Boeing";
                        post2.tagWithoutRefColName2 = tag2;
                        return [4 /*yield*/, connection.manager.save(post2)];
                    case 4:
                        _a.sent();
                        return [4 /*yield*/, connection.manager
                                .createQueryBuilder(Post_1.Post, "post")
                                .leftJoinAndSelect("post.tagWithoutRefColName2", "tagWithoutRefColName2")
                                .getMany()];
                    case 5:
                        loadedPosts = _a.sent();
                        chai_1.expect(loadedPosts[0].tagWithoutRefColName2).to.not.be.undefined;
                        chai_1.expect(loadedPosts[0].tagWithoutRefColName2.id).to.be.equal(1);
                        chai_1.expect(loadedPosts[1].tagWithoutRefColName2).to.not.be.undefined;
                        chai_1.expect(loadedPosts[1].tagWithoutRefColName2.id).to.be.equal(2);
                        return [4 /*yield*/, connection.manager
                                .createQueryBuilder(Post_1.Post, "post")
                                .leftJoinAndSelect("post.tagWithoutRefColName2", "tagWithoutRefColName2")
                                .where("post.id = :id", { id: 1 })
                                .getOne()];
                    case 6:
                        loadedPost = _a.sent();
                        chai_1.expect(loadedPost.tagWithoutRefColName2).to.not.be.undefined;
                        chai_1.expect(loadedPost.tagWithoutRefColName2.id).to.be.equal(1);
                        return [2 /*return*/];
                }
            });
        }); })); });
        it("should persist relation when relation sets via join column", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var tag1, tag2, post1, post2, loadedPosts, loadedPost;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        tag1 = new Tag_1.Tag();
                        tag1.name = "tag #1";
                        return [4 /*yield*/, connection.manager.save(tag1)];
                    case 1:
                        _a.sent();
                        tag2 = new Tag_1.Tag();
                        tag2.name = "tag #2";
                        return [4 /*yield*/, connection.manager.save(tag2)];
                    case 2:
                        _a.sent();
                        post1 = new Post_1.Post();
                        post1.title = "Post #1";
                        post1.tagName = "tag #1";
                        return [4 /*yield*/, connection.manager.save(post1)];
                    case 3:
                        _a.sent();
                        post2 = new Post_1.Post();
                        post2.title = "Post #2";
                        post2.tagName = "tag #2";
                        return [4 /*yield*/, connection.manager.save(post2)];
                    case 4:
                        _a.sent();
                        return [4 /*yield*/, connection.manager
                                .createQueryBuilder(Post_1.Post, "post")
                                .leftJoinAndSelect("post.tag", "tag")
                                .getMany()];
                    case 5:
                        loadedPosts = _a.sent();
                        chai_1.expect(loadedPosts[0].tag).to.not.be.undefined;
                        chai_1.expect(loadedPosts[0].tag.id).to.be.equal(1);
                        chai_1.expect(loadedPosts[1].tag).to.not.be.undefined;
                        chai_1.expect(loadedPosts[1].tag.id).to.be.equal(2);
                        return [4 /*yield*/, connection.manager
                                .createQueryBuilder(Post_1.Post, "post")
                                .leftJoinAndSelect("post.tag", "category")
                                .where("post.id = :id", { id: 1 })
                                .getOne()];
                    case 6:
                        loadedPost = _a.sent();
                        chai_1.expect(loadedPost.tag).to.not.be.undefined;
                        chai_1.expect(loadedPost.tag.id).to.be.equal(1);
                        return [2 /*return*/];
                }
            });
        }); })); });
    });
});
//# sourceMappingURL=custom-referenced-column-name.js.map