"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var chai_1 = require("chai");
var test_utils_1 = require("../../../../utils/test-utils");
var Category_1 = require("./entity/Category");
var Post_1 = require("./entity/Post");
var Tag_1 = require("./entity/Tag");
describe("relations > multiple-primary-keys > one-to-one", function () {
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
    describe("owning side", function () {
        it("should load related entity when JoinColumn is specified without options", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var category1, category2, post1, post2, loadedPosts, loadedPost;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        category1 = new Category_1.Category();
                        category1.name = "cars";
                        category1.type = "common-category";
                        category1.code = 1;
                        category1.version = 1;
                        return [4 /*yield*/, connection.manager.save(category1)];
                    case 1:
                        _a.sent();
                        category2 = new Category_1.Category();
                        category2.name = "airplanes";
                        category2.type = "common-category";
                        category2.code = 2;
                        category2.version = 1;
                        return [4 /*yield*/, connection.manager.save(category2)];
                    case 2:
                        _a.sent();
                        post1 = new Post_1.Post();
                        post1.title = "About cars #1";
                        post1.category = category1;
                        return [4 /*yield*/, connection.manager.save(post1)];
                    case 3:
                        _a.sent();
                        post2 = new Post_1.Post();
                        post2.title = "About cars #2";
                        post2.category = category2;
                        return [4 /*yield*/, connection.manager.save(post2)];
                    case 4:
                        _a.sent();
                        return [4 /*yield*/, connection.manager
                                .createQueryBuilder(Post_1.Post, "post")
                                .leftJoinAndSelect("post.category", "category")
                                .orderBy("post.id")
                                .getMany()];
                    case 5:
                        loadedPosts = _a.sent();
                        chai_1.expect(loadedPosts[0].category).to.not.be.undefined;
                        chai_1.expect(loadedPosts[0].category.name).to.be.equal("cars");
                        chai_1.expect(loadedPosts[0].category.type).to.be.equal("common-category");
                        chai_1.expect(loadedPosts[1].category).to.not.be.undefined;
                        chai_1.expect(loadedPosts[1].category.name).to.be.equal("airplanes");
                        chai_1.expect(loadedPosts[1].category.type).to.be.equal("common-category");
                        return [4 /*yield*/, connection.manager
                                .createQueryBuilder(Post_1.Post, "post")
                                .leftJoinAndSelect("post.category", "category")
                                .where("post.id = :id", { id: 1 })
                                .getOne()];
                    case 6:
                        loadedPost = _a.sent();
                        chai_1.expect(loadedPost.category).to.not.be.undefined;
                        chai_1.expect(loadedPost.category.name).to.be.equal("cars");
                        chai_1.expect(loadedPost.category.type).to.be.equal("common-category");
                        return [2 /*return*/];
                }
            });
        }); })); });
        it("should load related entity when JoinColumn is specified with options", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var category1, category2, post1, post2, loadedPosts, loadedPost;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        category1 = new Category_1.Category();
                        category1.name = "cars";
                        category1.type = "common-category";
                        category1.code = 1;
                        category1.version = 1;
                        return [4 /*yield*/, connection.manager.save(category1)];
                    case 1:
                        _a.sent();
                        category2 = new Category_1.Category();
                        category2.name = "airplanes";
                        category2.type = "common-category";
                        category2.code = 2;
                        category2.version = 1;
                        return [4 /*yield*/, connection.manager.save(category2)];
                    case 2:
                        _a.sent();
                        post1 = new Post_1.Post();
                        post1.title = "About cars #1";
                        post1.categoryWithOptions = category1;
                        return [4 /*yield*/, connection.manager.save(post1)];
                    case 3:
                        _a.sent();
                        post2 = new Post_1.Post();
                        post2.title = "About cars #2";
                        post2.categoryWithOptions = category2;
                        return [4 /*yield*/, connection.manager.save(post2)];
                    case 4:
                        _a.sent();
                        return [4 /*yield*/, connection.manager
                                .createQueryBuilder(Post_1.Post, "post")
                                .leftJoinAndSelect("post.categoryWithOptions", "category")
                                .orderBy("post.id")
                                .getMany()];
                    case 5:
                        loadedPosts = _a.sent();
                        chai_1.expect(loadedPosts[0].categoryWithOptions).to.not.be.eql([]);
                        chai_1.expect(loadedPosts[0].categoryWithOptions.name).to.be.equal("cars");
                        chai_1.expect(loadedPosts[0].categoryWithOptions.type).to.be.equal("common-category");
                        chai_1.expect(loadedPosts[1].categoryWithOptions).to.not.be.eql([]);
                        chai_1.expect(loadedPosts[1].categoryWithOptions.name).to.be.equal("airplanes");
                        chai_1.expect(loadedPosts[1].categoryWithOptions.type).to.be.equal("common-category");
                        return [4 /*yield*/, connection.manager
                                .createQueryBuilder(Post_1.Post, "post")
                                .leftJoinAndSelect("post.categoryWithOptions", "category")
                                .where("post.id = :id", { id: 1 })
                                .getOne()];
                    case 6:
                        loadedPost = _a.sent();
                        chai_1.expect(loadedPost.categoryWithOptions).to.not.be.eql([]);
                        chai_1.expect(loadedPost.categoryWithOptions.name).to.be.equal("cars");
                        chai_1.expect(loadedPost.categoryWithOptions.type).to.be.equal("common-category");
                        return [2 /*return*/];
                }
            });
        }); })); });
        it("should load related entity when JoinColumn references on to non-primary columns", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var category1, category2, post1, post2, loadedPosts, loadedPost;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        category1 = new Category_1.Category();
                        category1.name = "cars";
                        category1.type = "common-category";
                        category1.code = 1;
                        category1.version = 1;
                        category1.description = "category about cars";
                        return [4 /*yield*/, connection.manager.save(category1)];
                    case 1:
                        _a.sent();
                        category2 = new Category_1.Category();
                        category2.name = "airplanes";
                        category2.type = "common-category";
                        category2.code = 2;
                        category2.version = 1;
                        category2.description = "category about airplanes";
                        return [4 /*yield*/, connection.manager.save(category2)];
                    case 2:
                        _a.sent();
                        post1 = new Post_1.Post();
                        post1.title = "About cars #1";
                        post1.categoryWithNonPKColumns = category1;
                        return [4 /*yield*/, connection.manager.save(post1)];
                    case 3:
                        _a.sent();
                        post2 = new Post_1.Post();
                        post2.title = "About cars #2";
                        post2.categoryWithNonPKColumns = category2;
                        return [4 /*yield*/, connection.manager.save(post2)];
                    case 4:
                        _a.sent();
                        return [4 /*yield*/, connection.manager
                                .createQueryBuilder(Post_1.Post, "post")
                                .leftJoinAndSelect("post.categoryWithNonPKColumns", "category")
                                .orderBy("post.id")
                                .getMany()];
                    case 5:
                        loadedPosts = _a.sent();
                        chai_1.expect(loadedPosts[0].categoryWithNonPKColumns).to.not.be.eql([]);
                        chai_1.expect(loadedPosts[0].categoryWithNonPKColumns.code).to.be.equal(1);
                        chai_1.expect(loadedPosts[0].categoryWithNonPKColumns.version).to.be.equal(1);
                        chai_1.expect(loadedPosts[0].categoryWithNonPKColumns.description).to.be.equal("category about cars");
                        chai_1.expect(loadedPosts[1].categoryWithNonPKColumns).to.not.be.eql([]);
                        chai_1.expect(loadedPosts[1].categoryWithNonPKColumns.code).to.be.equal(2);
                        chai_1.expect(loadedPosts[1].categoryWithNonPKColumns.version).to.be.equal(1);
                        return [4 /*yield*/, connection.manager
                                .createQueryBuilder(Post_1.Post, "post")
                                .leftJoinAndSelect("post.categoryWithNonPKColumns", "category")
                                .where("post.id = :id", { id: 1 })
                                .getOne()];
                    case 6:
                        loadedPost = _a.sent();
                        chai_1.expect(loadedPost.categoryWithNonPKColumns).to.not.be.eql([]);
                        chai_1.expect(loadedPost.categoryWithNonPKColumns.code).to.be.equal(1);
                        chai_1.expect(loadedPost.categoryWithNonPKColumns.version).to.be.equal(1);
                        chai_1.expect(loadedPost.categoryWithNonPKColumns.description).to.be.equal("category about cars");
                        return [2 /*return*/];
                }
            });
        }); })); });
        it("should load related entity when both entities have multiple primary columns and JoinColumn defined without options", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var category1, category2, tag1, tag2, loadedTags, loadedTag;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        category1 = new Category_1.Category();
                        category1.name = "cars";
                        category1.type = "common-category";
                        category1.code = 1;
                        category1.version = 1;
                        return [4 /*yield*/, connection.manager.save(category1)];
                    case 1:
                        _a.sent();
                        category2 = new Category_1.Category();
                        category2.name = "airplanes";
                        category2.type = "common-category";
                        category2.code = 2;
                        category2.version = 1;
                        return [4 /*yield*/, connection.manager.save(category2)];
                    case 2:
                        _a.sent();
                        tag1 = new Tag_1.Tag();
                        tag1.code = 1;
                        tag1.title = "About BMW";
                        tag1.description = "Tag about BMW";
                        tag1.category = category1;
                        return [4 /*yield*/, connection.manager.save(tag1)];
                    case 3:
                        _a.sent();
                        tag2 = new Tag_1.Tag();
                        tag2.code = 3;
                        tag2.title = "About Boeing";
                        tag2.description = "tag about Boeing";
                        tag2.category = category2;
                        return [4 /*yield*/, connection.manager.save(tag2)];
                    case 4:
                        _a.sent();
                        return [4 /*yield*/, connection.manager
                                .createQueryBuilder(Tag_1.Tag, "tag")
                                .leftJoinAndSelect("tag.category", "category")
                                .orderBy("tag.code, category.code")
                                .getMany()];
                    case 5:
                        loadedTags = _a.sent();
                        chai_1.expect(loadedTags[0].category).to.not.be.undefined;
                        chai_1.expect(loadedTags[0].category.name).to.be.equal("cars");
                        chai_1.expect(loadedTags[0].category.type).to.be.equal("common-category");
                        chai_1.expect(loadedTags[1].category).to.not.be.undefined;
                        chai_1.expect(loadedTags[1].category.name).to.be.equal("airplanes");
                        chai_1.expect(loadedTags[1].category.type).to.be.equal("common-category");
                        return [4 /*yield*/, connection.manager
                                .createQueryBuilder(Tag_1.Tag, "tag")
                                .leftJoinAndSelect("tag.category", "category")
                                .orderBy("category.code")
                                .where("tag.code = :code", { code: 1 })
                                .getOne()];
                    case 6:
                        loadedTag = _a.sent();
                        chai_1.expect(loadedTag.category).to.not.be.undefined;
                        chai_1.expect(loadedTag.category.name).to.be.equal("cars");
                        chai_1.expect(loadedTag.category.type).to.be.equal("common-category");
                        return [2 /*return*/];
                }
            });
        }); })); });
        it("should load related entity when both entities have multiple primary columns and JoinColumn defined with options", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var category1, category2, tag1, tag2, loadedTags, loadedTag;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        category1 = new Category_1.Category();
                        category1.name = "cars";
                        category1.type = "common-category";
                        category1.code = 1;
                        category1.version = 1;
                        return [4 /*yield*/, connection.manager.save(category1)];
                    case 1:
                        _a.sent();
                        category2 = new Category_1.Category();
                        category2.name = "airplanes";
                        category2.type = "common-category";
                        category2.code = 2;
                        category2.version = 1;
                        return [4 /*yield*/, connection.manager.save(category2)];
                    case 2:
                        _a.sent();
                        tag1 = new Tag_1.Tag();
                        tag1.code = 1;
                        tag1.title = "About BMW";
                        tag1.description = "Tag about BMW";
                        tag1.categoryWithOptions = category1;
                        return [4 /*yield*/, connection.manager.save(tag1)];
                    case 3:
                        _a.sent();
                        tag2 = new Tag_1.Tag();
                        tag2.code = 3;
                        tag2.title = "About Boeing";
                        tag2.description = "tag about Boeing";
                        tag2.categoryWithOptions = category2;
                        return [4 /*yield*/, connection.manager.save(tag2)];
                    case 4:
                        _a.sent();
                        return [4 /*yield*/, connection.manager
                                .createQueryBuilder(Tag_1.Tag, "tag")
                                .leftJoinAndSelect("tag.categoryWithOptions", "category")
                                .orderBy("tag.code, category.code")
                                .getMany()];
                    case 5:
                        loadedTags = _a.sent();
                        chai_1.expect(loadedTags[0].categoryWithOptions).to.not.be.eql([]);
                        chai_1.expect(loadedTags[0].categoryWithOptions.name).to.be.equal("cars");
                        chai_1.expect(loadedTags[0].categoryWithOptions.type).to.be.equal("common-category");
                        chai_1.expect(loadedTags[1].categoryWithOptions).to.not.be.eql([]);
                        chai_1.expect(loadedTags[1].categoryWithOptions.name).to.be.equal("airplanes");
                        chai_1.expect(loadedTags[1].categoryWithOptions.type).to.be.equal("common-category");
                        return [4 /*yield*/, connection.manager
                                .createQueryBuilder(Tag_1.Tag, "tag")
                                .leftJoinAndSelect("tag.categoryWithOptions", "category")
                                .orderBy("category.code")
                                .where("tag.code = :code", { code: 1 })
                                .getOne()];
                    case 6:
                        loadedTag = _a.sent();
                        chai_1.expect(loadedTag.categoryWithOptions).to.not.be.eql([]);
                        chai_1.expect(loadedTag.categoryWithOptions.name).to.be.equal("cars");
                        chai_1.expect(loadedTag.categoryWithOptions.type).to.be.equal("common-category");
                        return [2 /*return*/];
                }
            });
        }); })); });
        it("should load related entity when both entities have multiple primary columns and JoinColumn references on to non-primary columns", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var category1, category2, tag1, tag2, loadedTags, loadedTag;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        category1 = new Category_1.Category();
                        category1.name = "cars";
                        category1.type = "common-category";
                        category1.code = 1;
                        category1.version = 1;
                        category1.description = "category of cars";
                        return [4 /*yield*/, connection.manager.save(category1)];
                    case 1:
                        _a.sent();
                        category2 = new Category_1.Category();
                        category2.name = "airplanes";
                        category2.type = "common-category";
                        category2.code = 2;
                        category2.version = 1;
                        category2.description = "category of airplanes";
                        return [4 /*yield*/, connection.manager.save(category2)];
                    case 2:
                        _a.sent();
                        tag1 = new Tag_1.Tag();
                        tag1.code = 1;
                        tag1.title = "About BMW";
                        tag1.description = "Tag about BMW";
                        tag1.categoryWithNonPKColumns = category1;
                        return [4 /*yield*/, connection.manager.save(tag1)];
                    case 3:
                        _a.sent();
                        tag2 = new Tag_1.Tag();
                        tag2.code = 3;
                        tag2.title = "About Boeing";
                        tag2.description = "tag about Boeing";
                        tag2.categoryWithNonPKColumns = category2;
                        return [4 /*yield*/, connection.manager.save(tag2)];
                    case 4:
                        _a.sent();
                        return [4 /*yield*/, connection.manager
                                .createQueryBuilder(Tag_1.Tag, "tag")
                                .leftJoinAndSelect("tag.categoryWithNonPKColumns", "category")
                                .orderBy("tag.code, category.code")
                                .getMany()];
                    case 5:
                        loadedTags = _a.sent();
                        chai_1.expect(loadedTags[0].categoryWithNonPKColumns).to.not.be.eql([]);
                        chai_1.expect(loadedTags[0].categoryWithNonPKColumns.name).to.be.equal("cars");
                        chai_1.expect(loadedTags[0].categoryWithNonPKColumns.type).to.be.equal("common-category");
                        chai_1.expect(loadedTags[1].categoryWithNonPKColumns).to.not.be.eql([]);
                        chai_1.expect(loadedTags[1].categoryWithNonPKColumns.name).to.be.equal("airplanes");
                        chai_1.expect(loadedTags[1].categoryWithNonPKColumns.type).to.be.equal("common-category");
                        return [4 /*yield*/, connection.manager
                                .createQueryBuilder(Tag_1.Tag, "tag")
                                .leftJoinAndSelect("tag.categoryWithNonPKColumns", "category")
                                .orderBy("category.code")
                                .where("tag.code = :code", { code: 1 })
                                .getOne()];
                    case 6:
                        loadedTag = _a.sent();
                        chai_1.expect(loadedTag.categoryWithNonPKColumns).to.not.be.eql([]);
                        chai_1.expect(loadedTag.categoryWithNonPKColumns.name).to.be.equal("cars");
                        chai_1.expect(loadedTag.categoryWithNonPKColumns.type).to.be.equal("common-category");
                        return [2 /*return*/];
                }
            });
        }); })); });
    });
    describe("inverse side", function () {
        it("should load related entity when JoinColumn is specified without options", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var post1, post2, category1, category2, loadedCategories, loadedCategory;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        post1 = new Post_1.Post();
                        post1.title = "About BMW";
                        return [4 /*yield*/, connection.manager.save(post1)];
                    case 1:
                        _a.sent();
                        post2 = new Post_1.Post();
                        post2.title = "About Boeing";
                        return [4 /*yield*/, connection.manager.save(post2)];
                    case 2:
                        _a.sent();
                        category1 = new Category_1.Category();
                        category1.name = "cars";
                        category1.type = "common-category";
                        category1.code = 1;
                        category1.version = 1;
                        category1.post = post1;
                        return [4 /*yield*/, connection.manager.save(category1)];
                    case 3:
                        _a.sent();
                        category2 = new Category_1.Category();
                        category2.name = "airplanes";
                        category2.type = "common-category";
                        category2.code = 2;
                        category2.version = 1;
                        category2.post = post2;
                        return [4 /*yield*/, connection.manager.save(category2)];
                    case 4:
                        _a.sent();
                        return [4 /*yield*/, connection.manager
                                .createQueryBuilder(Category_1.Category, "category")
                                .leftJoinAndSelect("category.post", "post")
                                .orderBy("category.code, post.id")
                                .getMany()];
                    case 5:
                        loadedCategories = _a.sent();
                        chai_1.expect(loadedCategories[0].post).to.not.be.undefined;
                        chai_1.expect(loadedCategories[0].post.id).to.be.equal(1);
                        chai_1.expect(loadedCategories[1].post).to.not.be.undefined;
                        chai_1.expect(loadedCategories[1].post.id).to.be.equal(2);
                        return [4 /*yield*/, connection.manager
                                .createQueryBuilder(Category_1.Category, "category")
                                .leftJoinAndSelect("category.post", "post")
                                .orderBy("post.id")
                                .where("category.code = :code", { code: 1 })
                                .getOne()];
                    case 6:
                        loadedCategory = _a.sent();
                        chai_1.expect(loadedCategory.post).to.not.be.undefined;
                        chai_1.expect(loadedCategory.post.id).to.be.equal(1);
                        return [2 /*return*/];
                }
            });
        }); })); });
        it("should load related entity when both entities have multiple primary columns and JoinColumn defined without options", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var tag1, tag2, category1, category2, loadedCategories, loadedCategory;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        tag1 = new Tag_1.Tag();
                        tag1.code = 1;
                        tag1.title = "About BMW";
                        tag1.description = "Tag about BMW";
                        return [4 /*yield*/, connection.manager.save(tag1)];
                    case 1:
                        _a.sent();
                        tag2 = new Tag_1.Tag();
                        tag2.code = 3;
                        tag2.title = "About Boeing";
                        tag2.description = "tag about Boeing";
                        return [4 /*yield*/, connection.manager.save(tag2)];
                    case 2:
                        _a.sent();
                        category1 = new Category_1.Category();
                        category1.name = "cars";
                        category1.type = "common-category";
                        category1.code = 1;
                        category1.version = 1;
                        category1.tag = tag1;
                        return [4 /*yield*/, connection.manager.save(category1)];
                    case 3:
                        _a.sent();
                        category2 = new Category_1.Category();
                        category2.name = "airplanes";
                        category2.type = "common-category";
                        category2.code = 2;
                        category2.version = 1;
                        category2.tag = tag2;
                        return [4 /*yield*/, connection.manager.save(category2)];
                    case 4:
                        _a.sent();
                        return [4 /*yield*/, connection.manager
                                .createQueryBuilder(Category_1.Category, "category")
                                .leftJoinAndSelect("category.tag", "tag")
                                .orderBy("category.code, tag.code")
                                .getMany()];
                    case 5:
                        loadedCategories = _a.sent();
                        chai_1.expect(loadedCategories[0].tag).to.not.be.undefined;
                        chai_1.expect(loadedCategories[0].tag.title).to.be.equal("About BMW");
                        chai_1.expect(loadedCategories[0].tag.description).to.be.equal("Tag about BMW");
                        chai_1.expect(loadedCategories[1].tag).to.not.be.undefined;
                        chai_1.expect(loadedCategories[1].tag.title).to.be.equal("About Boeing");
                        chai_1.expect(loadedCategories[1].tag.description).to.be.equal("tag about Boeing");
                        return [4 /*yield*/, connection.manager
                                .createQueryBuilder(Category_1.Category, "category")
                                .leftJoinAndSelect("category.tag", "tag")
                                .orderBy("tag.code")
                                .where("category.code = :code", { code: 1 })
                                .getOne()];
                    case 6:
                        loadedCategory = _a.sent();
                        chai_1.expect(loadedCategory.tag).to.not.be.undefined;
                        chai_1.expect(loadedCategory.tag.title).to.be.equal("About BMW");
                        chai_1.expect(loadedCategory.tag.description).to.be.equal("Tag about BMW");
                        return [2 /*return*/];
                }
            });
        }); })); });
        it("should load related entity when both entities have multiple primary columns and JoinColumn defined with options", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var tag1, tag2, category1, category2, loadedCategories, loadedCategory;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        tag1 = new Tag_1.Tag();
                        tag1.code = 1;
                        tag1.title = "About BMW";
                        tag1.description = "Tag about BMW";
                        return [4 /*yield*/, connection.manager.save(tag1)];
                    case 1:
                        _a.sent();
                        tag2 = new Tag_1.Tag();
                        tag2.code = 3;
                        tag2.title = "About Boeing";
                        tag2.description = "tag about Boeing";
                        return [4 /*yield*/, connection.manager.save(tag2)];
                    case 2:
                        _a.sent();
                        category1 = new Category_1.Category();
                        category1.name = "cars";
                        category1.type = "common-category";
                        category1.code = 1;
                        category1.version = 1;
                        category1.tagWithOptions = tag1;
                        return [4 /*yield*/, connection.manager.save(category1)];
                    case 3:
                        _a.sent();
                        category2 = new Category_1.Category();
                        category2.name = "airplanes";
                        category2.type = "common-category";
                        category2.code = 2;
                        category2.version = 1;
                        category2.tagWithOptions = tag2;
                        return [4 /*yield*/, connection.manager.save(category2)];
                    case 4:
                        _a.sent();
                        return [4 /*yield*/, connection.manager
                                .createQueryBuilder(Category_1.Category, "category")
                                .leftJoinAndSelect("category.tagWithOptions", "tag")
                                .orderBy("category.code, tag.code")
                                .getMany()];
                    case 5:
                        loadedCategories = _a.sent();
                        chai_1.expect(loadedCategories[0].tagWithOptions).to.not.be.eql([]);
                        chai_1.expect(loadedCategories[0].tagWithOptions.title).to.be.equal("About BMW");
                        chai_1.expect(loadedCategories[0].tagWithOptions.description).to.be.equal("Tag about BMW");
                        chai_1.expect(loadedCategories[1].tagWithOptions).to.not.be.eql([]);
                        chai_1.expect(loadedCategories[1].tagWithOptions.title).to.be.equal("About Boeing");
                        chai_1.expect(loadedCategories[1].tagWithOptions.description).to.be.equal("tag about Boeing");
                        return [4 /*yield*/, connection.manager
                                .createQueryBuilder(Category_1.Category, "category")
                                .leftJoinAndSelect("category.tagWithOptions", "tag")
                                .orderBy("tag.code")
                                .where("category.code = :code", { code: 1 })
                                .getOne()];
                    case 6:
                        loadedCategory = _a.sent();
                        chai_1.expect(loadedCategory.tagWithOptions).to.not.be.eql([]);
                        chai_1.expect(loadedCategory.tagWithOptions.title).to.be.equal("About BMW");
                        chai_1.expect(loadedCategory.tagWithOptions.description).to.be.equal("Tag about BMW");
                        return [2 /*return*/];
                }
            });
        }); })); });
        it("should load related entity when JoinColumns references on to non-primary columns", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var tag1, tag2, category1, category2, loadedCategories, loadedCategory;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        tag1 = new Tag_1.Tag();
                        tag1.code = 1;
                        tag1.title = "About BMW";
                        tag1.description = "Tag about BMW";
                        return [4 /*yield*/, connection.manager.save(tag1)];
                    case 1:
                        _a.sent();
                        tag2 = new Tag_1.Tag();
                        tag2.code = 3;
                        tag2.title = "About Boeing";
                        tag2.description = "tag about Boeing";
                        return [4 /*yield*/, connection.manager.save(tag2)];
                    case 2:
                        _a.sent();
                        category1 = new Category_1.Category();
                        category1.name = "cars";
                        category1.type = "common-category";
                        category1.code = 1;
                        category1.version = 1;
                        category1.description = "category of cars";
                        category1.tagWithNonPKColumns = tag1;
                        return [4 /*yield*/, connection.manager.save(category1)];
                    case 3:
                        _a.sent();
                        category2 = new Category_1.Category();
                        category2.name = "airplanes";
                        category2.type = "common-category";
                        category2.code = 2;
                        category2.version = 1;
                        category2.description = "category of airplanes";
                        category2.tagWithNonPKColumns = tag2;
                        return [4 /*yield*/, connection.manager.save(category2)];
                    case 4:
                        _a.sent();
                        return [4 /*yield*/, connection.manager
                                .createQueryBuilder(Category_1.Category, "category")
                                .leftJoinAndSelect("category.tagWithNonPKColumns", "tag")
                                .orderBy("category.code, tag.code")
                                .getMany()];
                    case 5:
                        loadedCategories = _a.sent();
                        chai_1.expect(loadedCategories[0].tagWithNonPKColumns).to.not.be.eql([]);
                        chai_1.expect(loadedCategories[0].tagWithNonPKColumns.title).to.be.equal("About BMW");
                        chai_1.expect(loadedCategories[0].tagWithNonPKColumns.description).to.be.equal("Tag about BMW");
                        chai_1.expect(loadedCategories[1].tagWithNonPKColumns).to.not.be.eql([]);
                        chai_1.expect(loadedCategories[1].tagWithNonPKColumns.title).to.be.equal("About Boeing");
                        chai_1.expect(loadedCategories[1].tagWithNonPKColumns.description).to.be.equal("tag about Boeing");
                        return [4 /*yield*/, connection.manager
                                .createQueryBuilder(Category_1.Category, "category")
                                .leftJoinAndSelect("category.tagWithNonPKColumns", "tag")
                                .orderBy("tag.code")
                                .where("category.code = :code", { code: 1 })
                                .getOne()];
                    case 6:
                        loadedCategory = _a.sent();
                        chai_1.expect(loadedCategory.tagWithNonPKColumns).to.not.be.eql([]);
                        chai_1.expect(loadedCategory.tagWithNonPKColumns.title).to.be.equal("About BMW");
                        chai_1.expect(loadedCategory.tagWithNonPKColumns.description).to.be.equal("Tag about BMW");
                        return [2 /*return*/];
                }
            });
        }); })); });
        it("should load related entity when both entities have multiple primary columns and JoinColumn defined with options", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var tag1, tag2, category1, category2, loadedCategories, loadedCategory;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        tag1 = new Tag_1.Tag();
                        tag1.code = 1;
                        tag1.title = "About BMW";
                        tag1.description = "Tag about BMW";
                        return [4 /*yield*/, connection.manager.save(tag1)];
                    case 1:
                        _a.sent();
                        tag2 = new Tag_1.Tag();
                        tag2.code = 3;
                        tag2.title = "About Boeing";
                        tag2.description = "tag about Boeing";
                        return [4 /*yield*/, connection.manager.save(tag2)];
                    case 2:
                        _a.sent();
                        category1 = new Category_1.Category();
                        category1.name = "cars";
                        category1.type = "common-category";
                        category1.code = 1;
                        category1.version = 1;
                        category1.tagWithOptions = tag1;
                        return [4 /*yield*/, connection.manager.save(category1)];
                    case 3:
                        _a.sent();
                        category2 = new Category_1.Category();
                        category2.name = "airplanes";
                        category2.type = "common-category";
                        category2.code = 2;
                        category2.version = 1;
                        category2.tagWithOptions = tag2;
                        return [4 /*yield*/, connection.manager.save(category2)];
                    case 4:
                        _a.sent();
                        return [4 /*yield*/, connection.manager
                                .createQueryBuilder(Category_1.Category, "category")
                                .leftJoinAndSelect("category.tagWithOptions", "tag")
                                .orderBy("category.code, tag.code")
                                .getMany()];
                    case 5:
                        loadedCategories = _a.sent();
                        chai_1.expect(loadedCategories[0].tagWithOptions).to.not.be.eql([]);
                        chai_1.expect(loadedCategories[0].tagWithOptions.title).to.be.equal("About BMW");
                        chai_1.expect(loadedCategories[0].tagWithOptions.description).to.be.equal("Tag about BMW");
                        chai_1.expect(loadedCategories[1].tagWithOptions).to.not.be.eql([]);
                        chai_1.expect(loadedCategories[1].tagWithOptions.title).to.be.equal("About Boeing");
                        chai_1.expect(loadedCategories[1].tagWithOptions.description).to.be.equal("tag about Boeing");
                        return [4 /*yield*/, connection.manager
                                .createQueryBuilder(Category_1.Category, "category")
                                .leftJoinAndSelect("category.tagWithOptions", "tag")
                                .orderBy("tag.code")
                                .where("category.code = :code", { code: 1 })
                                .getOne()];
                    case 6:
                        loadedCategory = _a.sent();
                        chai_1.expect(loadedCategory.tagWithOptions).to.not.be.eql([]);
                        chai_1.expect(loadedCategory.tagWithOptions.title).to.be.equal("About BMW");
                        chai_1.expect(loadedCategory.tagWithOptions.description).to.be.equal("Tag about BMW");
                        return [2 /*return*/];
                }
            });
        }); })); });
        it("should load related entity when both entities have multiple primary columns and JoinColumn references on to non-primary columns", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var tag1, tag2, category1, category2, loadedCategories, loadedCategory;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        tag1 = new Tag_1.Tag();
                        tag1.code = 1;
                        tag1.title = "About BMW";
                        tag1.description = "Tag about BMW";
                        return [4 /*yield*/, connection.manager.save(tag1)];
                    case 1:
                        _a.sent();
                        tag2 = new Tag_1.Tag();
                        tag2.code = 3;
                        tag2.title = "About Boeing";
                        tag2.description = "tag about Boeing";
                        return [4 /*yield*/, connection.manager.save(tag2)];
                    case 2:
                        _a.sent();
                        category1 = new Category_1.Category();
                        category1.name = "cars";
                        category1.type = "common-category";
                        category1.code = 1;
                        category1.version = 1;
                        category1.description = "category of cars";
                        category1.tagWithNonPKColumns = tag1;
                        return [4 /*yield*/, connection.manager.save(category1)];
                    case 3:
                        _a.sent();
                        category2 = new Category_1.Category();
                        category2.name = "airplanes";
                        category2.type = "common-category";
                        category2.code = 2;
                        category2.version = 1;
                        category2.description = "category of airplanes";
                        category2.tagWithNonPKColumns = tag2;
                        return [4 /*yield*/, connection.manager.save(category2)];
                    case 4:
                        _a.sent();
                        return [4 /*yield*/, connection.manager
                                .createQueryBuilder(Category_1.Category, "category")
                                .leftJoinAndSelect("category.tagWithNonPKColumns", "tag")
                                .orderBy("category.code, tag.code")
                                .getMany()];
                    case 5:
                        loadedCategories = _a.sent();
                        chai_1.expect(loadedCategories[0].tagWithNonPKColumns).to.not.be.eql([]);
                        chai_1.expect(loadedCategories[0].tagWithNonPKColumns.title).to.be.equal("About BMW");
                        chai_1.expect(loadedCategories[0].tagWithNonPKColumns.description).to.be.equal("Tag about BMW");
                        chai_1.expect(loadedCategories[1].tagWithNonPKColumns).to.not.be.eql([]);
                        chai_1.expect(loadedCategories[1].tagWithNonPKColumns.title).to.be.equal("About Boeing");
                        chai_1.expect(loadedCategories[1].tagWithNonPKColumns.description).to.be.equal("tag about Boeing");
                        return [4 /*yield*/, connection.manager
                                .createQueryBuilder(Category_1.Category, "category")
                                .leftJoinAndSelect("category.tagWithNonPKColumns", "tag")
                                .orderBy("tag.code")
                                .where("category.code = :code", { code: 1 })
                                .getOne()];
                    case 6:
                        loadedCategory = _a.sent();
                        chai_1.expect(loadedCategory.tagWithNonPKColumns).to.not.be.eql([]);
                        chai_1.expect(loadedCategory.tagWithNonPKColumns.title).to.be.equal("About BMW");
                        chai_1.expect(loadedCategory.tagWithNonPKColumns.description).to.be.equal("Tag about BMW");
                        return [2 /*return*/];
                }
            });
        }); })); });
    });
});
//# sourceMappingURL=multiple-primary-keys-one-to-one.js.map