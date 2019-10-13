"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var chai_1 = require("chai");
var test_utils_1 = require("../../../../utils/test-utils");
var Post_1 = require("./entity/Post");
var Category_1 = require("./entity/Category");
var Tag_1 = require("./entity/Tag");
describe("relations > multiple-primary-keys > many-to-many", function () {
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
        it("should load related entity when JoinTable used without options", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var category1, category2, category3, post1, post2, loadedPosts, loadedPost;
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
                        category2.name = "BMW";
                        category2.type = "cars-category";
                        category2.code = 2;
                        category2.version = 1;
                        return [4 /*yield*/, connection.manager.save(category2)];
                    case 2:
                        _a.sent();
                        category3 = new Category_1.Category();
                        category3.name = "airplanes";
                        category3.type = "common-category";
                        category3.code = 3;
                        category3.version = 1;
                        return [4 /*yield*/, connection.manager.save(category3)];
                    case 3:
                        _a.sent();
                        post1 = new Post_1.Post();
                        post1.title = "About BMW";
                        post1.categories = [category1, category2];
                        return [4 /*yield*/, connection.manager.save(post1)];
                    case 4:
                        _a.sent();
                        post2 = new Post_1.Post();
                        post2.title = "About Boeing";
                        post2.categories = [category3];
                        return [4 /*yield*/, connection.manager.save(post2)];
                    case 5:
                        _a.sent();
                        return [4 /*yield*/, connection.manager
                                .createQueryBuilder(Post_1.Post, "post")
                                .leftJoinAndSelect("post.categories", "categories")
                                .orderBy("post.id, categories.code")
                                .getMany()];
                    case 6:
                        loadedPosts = _a.sent();
                        chai_1.expect(loadedPosts[0].categories).to.not.be.eql([]);
                        chai_1.expect(loadedPosts[0].categories[0].name).to.be.equal("cars");
                        chai_1.expect(loadedPosts[0].categories[0].type).to.be.equal("common-category");
                        chai_1.expect(loadedPosts[0].categories[1].name).to.be.equal("BMW");
                        chai_1.expect(loadedPosts[0].categories[1].type).to.be.equal("cars-category");
                        chai_1.expect(loadedPosts[1].categories).to.not.be.eql([]);
                        chai_1.expect(loadedPosts[1].categories[0].name).to.be.equal("airplanes");
                        chai_1.expect(loadedPosts[1].categories[0].type).to.be.equal("common-category");
                        return [4 /*yield*/, connection.manager
                                .createQueryBuilder(Post_1.Post, "post")
                                .leftJoinAndSelect("post.categories", "categories")
                                .orderBy("categories.code")
                                .where("post.id = :id", { id: 1 })
                                .getOne()];
                    case 7:
                        loadedPost = _a.sent();
                        chai_1.expect(loadedPost.categories).to.not.be.eql([]);
                        chai_1.expect(loadedPost.categories[0].name).to.be.equal("cars");
                        chai_1.expect(loadedPost.categories[0].type).to.be.equal("common-category");
                        return [2 /*return*/];
                }
            });
        }); })); });
        it("should load related entity when JoinTable used with options", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var category1, category2, category3, post1, post2, loadedPosts, loadedPost;
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
                        category2.name = "BMW";
                        category2.type = "cars-category";
                        category2.code = 2;
                        category2.version = 1;
                        return [4 /*yield*/, connection.manager.save(category2)];
                    case 2:
                        _a.sent();
                        category3 = new Category_1.Category();
                        category3.name = "airplanes";
                        category3.type = "common-category";
                        category3.code = 3;
                        category3.version = 1;
                        return [4 /*yield*/, connection.manager.save(category3)];
                    case 3:
                        _a.sent();
                        post1 = new Post_1.Post();
                        post1.title = "About BMW";
                        post1.categoriesWithOptions = [category1, category2];
                        return [4 /*yield*/, connection.manager.save(post1)];
                    case 4:
                        _a.sent();
                        post2 = new Post_1.Post();
                        post2.title = "About Boeing";
                        post2.categoriesWithOptions = [category3];
                        return [4 /*yield*/, connection.manager.save(post2)];
                    case 5:
                        _a.sent();
                        return [4 /*yield*/, connection.manager
                                .createQueryBuilder(Post_1.Post, "post")
                                .leftJoinAndSelect("post.categoriesWithOptions", "categories")
                                .orderBy("post.id, categories.code")
                                .getMany()];
                    case 6:
                        loadedPosts = _a.sent();
                        chai_1.expect(loadedPosts[0].categoriesWithOptions).to.not.be.eql([]);
                        chai_1.expect(loadedPosts[0].categoriesWithOptions[0].name).to.be.equal("cars");
                        chai_1.expect(loadedPosts[0].categoriesWithOptions[0].type).to.be.equal("common-category");
                        chai_1.expect(loadedPosts[0].categoriesWithOptions[1].name).to.be.equal("BMW");
                        chai_1.expect(loadedPosts[0].categoriesWithOptions[1].type).to.be.equal("cars-category");
                        chai_1.expect(loadedPosts[1].categoriesWithOptions).to.not.be.eql([]);
                        chai_1.expect(loadedPosts[1].categoriesWithOptions[0].name).to.be.equal("airplanes");
                        chai_1.expect(loadedPosts[1].categoriesWithOptions[0].type).to.be.equal("common-category");
                        return [4 /*yield*/, connection.manager
                                .createQueryBuilder(Post_1.Post, "post")
                                .leftJoinAndSelect("post.categoriesWithOptions", "categories")
                                .orderBy("categories.code")
                                .where("post.id = :id", { id: 1 })
                                .getOne()];
                    case 7:
                        loadedPost = _a.sent();
                        chai_1.expect(loadedPost.categoriesWithOptions).to.not.be.eql([]);
                        chai_1.expect(loadedPost.categoriesWithOptions[0].name).to.be.equal("cars");
                        chai_1.expect(loadedPost.categoriesWithOptions[0].type).to.be.equal("common-category");
                        return [2 /*return*/];
                }
            });
        }); })); });
        it("should load related entity when JoinTable references with non-primary columns", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var category1, category2, category3, post1, post2, loadedPosts, loadedPost;
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
                        category2.name = "BMW";
                        category2.type = "cars-category";
                        category2.code = 2;
                        category2.version = 1;
                        category2.description = "category of BMW";
                        return [4 /*yield*/, connection.manager.save(category2)];
                    case 2:
                        _a.sent();
                        category3 = new Category_1.Category();
                        category3.name = "airplanes";
                        category3.type = "common-category";
                        category3.code = 3;
                        category3.version = 1;
                        category3.description = "category of airplanes";
                        return [4 /*yield*/, connection.manager.save(category3)];
                    case 3:
                        _a.sent();
                        post1 = new Post_1.Post();
                        post1.title = "About BMW";
                        post1.categoriesWithNonPKColumns = [category1, category2];
                        return [4 /*yield*/, connection.manager.save(post1)];
                    case 4:
                        _a.sent();
                        post2 = new Post_1.Post();
                        post2.title = "About Boeing";
                        post2.categoriesWithNonPKColumns = [category3];
                        return [4 /*yield*/, connection.manager.save(post2)];
                    case 5:
                        _a.sent();
                        return [4 /*yield*/, connection.manager
                                .createQueryBuilder(Post_1.Post, "post")
                                .leftJoinAndSelect("post.categoriesWithNonPKColumns", "categories")
                                .orderBy("post.id, categories.code")
                                .getMany()];
                    case 6:
                        loadedPosts = _a.sent();
                        chai_1.expect(loadedPosts[0].categoriesWithNonPKColumns).to.not.be.eql([]);
                        chai_1.expect(loadedPosts[0].categoriesWithNonPKColumns[0].code).to.be.equal(1);
                        chai_1.expect(loadedPosts[0].categoriesWithNonPKColumns[0].version).to.be.equal(1);
                        chai_1.expect(loadedPosts[0].categoriesWithNonPKColumns[0].description).to.be.equal("category of cars");
                        chai_1.expect(loadedPosts[0].categoriesWithNonPKColumns[1].code).to.be.equal(2);
                        chai_1.expect(loadedPosts[0].categoriesWithNonPKColumns[1].version).to.be.equal(1);
                        chai_1.expect(loadedPosts[0].categoriesWithNonPKColumns[1].description).to.be.equal("category of BMW");
                        chai_1.expect(loadedPosts[1].categoriesWithNonPKColumns).to.not.be.eql([]);
                        chai_1.expect(loadedPosts[1].categoriesWithNonPKColumns[0].code).to.be.equal(3);
                        chai_1.expect(loadedPosts[1].categoriesWithNonPKColumns[0].version).to.be.equal(1);
                        chai_1.expect(loadedPosts[1].categoriesWithNonPKColumns[0].description).to.be.equal("category of airplanes");
                        return [4 /*yield*/, connection.manager
                                .createQueryBuilder(Post_1.Post, "post")
                                .leftJoinAndSelect("post.categoriesWithNonPKColumns", "categories")
                                .orderBy("categories.code")
                                .where("post.id = :id", { id: 1 })
                                .getOne()];
                    case 7:
                        loadedPost = _a.sent();
                        chai_1.expect(loadedPost.categoriesWithNonPKColumns).to.not.be.eql([]);
                        chai_1.expect(loadedPost.categoriesWithNonPKColumns[0].code).to.be.equal(1);
                        chai_1.expect(loadedPost.categoriesWithNonPKColumns[0].version).to.be.equal(1);
                        chai_1.expect(loadedPost.categoriesWithNonPKColumns[0].description).to.be.equal("category of cars");
                        return [2 /*return*/];
                }
            });
        }); })); });
        it("should load related entity when both entities have multiple primary columns and JoinTable used without options", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var category1, category2, category3, tag1, tag2, loadedTags, loadedTag;
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
                        category2.name = "BMW";
                        category2.type = "cars-category";
                        category2.code = 2;
                        category2.version = 1;
                        return [4 /*yield*/, connection.manager.save(category2)];
                    case 2:
                        _a.sent();
                        category3 = new Category_1.Category();
                        category3.name = "airplanes";
                        category3.type = "common-category";
                        category3.code = 3;
                        category3.version = 1;
                        return [4 /*yield*/, connection.manager.save(category3)];
                    case 3:
                        _a.sent();
                        tag1 = new Tag_1.Tag();
                        tag1.code = 1;
                        tag1.title = "About BMW";
                        tag1.description = "Tag about BMW";
                        tag1.categories = [category1, category2];
                        return [4 /*yield*/, connection.manager.save(tag1)];
                    case 4:
                        _a.sent();
                        tag2 = new Tag_1.Tag();
                        tag2.code = 2;
                        tag2.title = "About Boeing";
                        tag2.description = "tag about Boeing";
                        tag2.categories = [category3];
                        return [4 /*yield*/, connection.manager.save(tag2)];
                    case 5:
                        _a.sent();
                        return [4 /*yield*/, connection.manager
                                .createQueryBuilder(Tag_1.Tag, "tag")
                                .leftJoinAndSelect("tag.categories", "categories")
                                .orderBy("tag.code, categories.code")
                                .getMany()];
                    case 6:
                        loadedTags = _a.sent();
                        chai_1.expect(loadedTags[0].categories).to.not.be.eql([]);
                        chai_1.expect(loadedTags[0].categories[0].name).to.be.equal("cars");
                        chai_1.expect(loadedTags[0].categories[0].type).to.be.equal("common-category");
                        chai_1.expect(loadedTags[0].categories[1].name).to.be.equal("BMW");
                        chai_1.expect(loadedTags[0].categories[1].type).to.be.equal("cars-category");
                        chai_1.expect(loadedTags[1].categories).to.not.be.eql([]);
                        chai_1.expect(loadedTags[1].categories[0].name).to.be.equal("airplanes");
                        chai_1.expect(loadedTags[1].categories[0].type).to.be.equal("common-category");
                        return [4 /*yield*/, connection.manager
                                .createQueryBuilder(Tag_1.Tag, "tag")
                                .leftJoinAndSelect("tag.categories", "categories")
                                .orderBy("categories.code")
                                .where("tag.code = :code", { code: 1 })
                                .getOne()];
                    case 7:
                        loadedTag = _a.sent();
                        chai_1.expect(loadedTag.categories).to.not.be.eql([]);
                        chai_1.expect(loadedTag.categories[0].name).to.be.equal("cars");
                        chai_1.expect(loadedTag.categories[0].type).to.be.equal("common-category");
                        return [2 /*return*/];
                }
            });
        }); })); });
        it("should load related entity when both entities have multiple primary columns and JoinTable used with options", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var category1, category2, category3, tag1, tag2, loadedTags, loadedTag;
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
                        category2.name = "BMW";
                        category2.type = "cars-category";
                        category2.code = 2;
                        category2.version = 1;
                        return [4 /*yield*/, connection.manager.save(category2)];
                    case 2:
                        _a.sent();
                        category3 = new Category_1.Category();
                        category3.name = "airplanes";
                        category3.type = "common-category";
                        category3.code = 3;
                        category3.version = 1;
                        return [4 /*yield*/, connection.manager.save(category3)];
                    case 3:
                        _a.sent();
                        tag1 = new Tag_1.Tag();
                        tag1.code = 1;
                        tag1.title = "About BMW";
                        tag1.description = "Tag about BMW";
                        tag1.categoriesWithOptions = [category1, category2];
                        return [4 /*yield*/, connection.manager.save(tag1)];
                    case 4:
                        _a.sent();
                        tag2 = new Tag_1.Tag();
                        tag2.code = 2;
                        tag2.title = "About Boeing";
                        tag2.description = "Tag about Boeing";
                        tag2.categoriesWithOptions = [category3];
                        return [4 /*yield*/, connection.manager.save(tag2)];
                    case 5:
                        _a.sent();
                        return [4 /*yield*/, connection.manager
                                .createQueryBuilder(Tag_1.Tag, "tag")
                                .leftJoinAndSelect("tag.categoriesWithOptions", "categories")
                                .orderBy("tag.code, categories.code")
                                .getMany()];
                    case 6:
                        loadedTags = _a.sent();
                        chai_1.expect(loadedTags[0].categoriesWithOptions).to.not.be.eql([]);
                        chai_1.expect(loadedTags[0].categoriesWithOptions[0].name).to.be.equal("cars");
                        chai_1.expect(loadedTags[0].categoriesWithOptions[0].type).to.be.equal("common-category");
                        chai_1.expect(loadedTags[0].categoriesWithOptions[1].name).to.be.equal("BMW");
                        chai_1.expect(loadedTags[0].categoriesWithOptions[1].type).to.be.equal("cars-category");
                        chai_1.expect(loadedTags[1].categoriesWithOptions).to.not.be.eql([]);
                        chai_1.expect(loadedTags[1].categoriesWithOptions[0].name).to.be.equal("airplanes");
                        chai_1.expect(loadedTags[1].categoriesWithOptions[0].type).to.be.equal("common-category");
                        return [4 /*yield*/, connection.manager
                                .createQueryBuilder(Tag_1.Tag, "tag")
                                .leftJoinAndSelect("tag.categoriesWithOptions", "categories")
                                .orderBy("categories.code")
                                .where("tag.code = :code", { code: 1 })
                                .getOne()];
                    case 7:
                        loadedTag = _a.sent();
                        chai_1.expect(loadedTag.categoriesWithOptions).to.not.be.eql([]);
                        chai_1.expect(loadedTag.categoriesWithOptions[0].name).to.be.equal("cars");
                        chai_1.expect(loadedTag.categoriesWithOptions[0].type).to.be.equal("common-category");
                        return [2 /*return*/];
                }
            });
        }); })); });
        it("should load related entity when both entities have multiple primary columns and JoinTable references with non-primary columns", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var category1, category2, category3, tag1, tag2, loadedTags, loadedTag;
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
                        category2.name = "BMW";
                        category2.type = "cars-category";
                        category2.code = 2;
                        category2.version = 1;
                        category2.description = "category of BMW";
                        return [4 /*yield*/, connection.manager.save(category2)];
                    case 2:
                        _a.sent();
                        category3 = new Category_1.Category();
                        category3.name = "airplanes";
                        category3.type = "common-category";
                        category3.code = 3;
                        category3.version = 1;
                        category3.description = "category of airplanes";
                        return [4 /*yield*/, connection.manager.save(category3)];
                    case 3:
                        _a.sent();
                        tag1 = new Tag_1.Tag();
                        tag1.code = 1;
                        tag1.title = "About BMW";
                        tag1.description = "Tag about BMW";
                        tag1.categoriesWithNonPKColumns = [category1, category2];
                        return [4 /*yield*/, connection.manager.save(tag1)];
                    case 4:
                        _a.sent();
                        tag2 = new Tag_1.Tag();
                        tag2.code = 2;
                        tag2.title = "About Boeing";
                        tag2.description = "Tag about Boeing";
                        tag2.categoriesWithNonPKColumns = [category3];
                        return [4 /*yield*/, connection.manager.save(tag2)];
                    case 5:
                        _a.sent();
                        return [4 /*yield*/, connection.manager
                                .createQueryBuilder(Tag_1.Tag, "tag")
                                .leftJoinAndSelect("tag.categoriesWithNonPKColumns", "categories")
                                .orderBy("tag.code, categories.code")
                                .getMany()];
                    case 6:
                        loadedTags = _a.sent();
                        chai_1.expect(loadedTags[0].categoriesWithNonPKColumns).to.not.be.eql([]);
                        chai_1.expect(loadedTags[0].categoriesWithNonPKColumns[0].code).to.be.equal(1);
                        chai_1.expect(loadedTags[0].categoriesWithNonPKColumns[0].version).to.be.equal(1);
                        chai_1.expect(loadedTags[0].categoriesWithNonPKColumns[0].description).to.be.equal("category of cars");
                        chai_1.expect(loadedTags[0].categoriesWithNonPKColumns[1].code).to.be.equal(2);
                        chai_1.expect(loadedTags[0].categoriesWithNonPKColumns[1].version).to.be.equal(1);
                        chai_1.expect(loadedTags[0].categoriesWithNonPKColumns[1].description).to.be.equal("category of BMW");
                        chai_1.expect(loadedTags[1].categoriesWithNonPKColumns).to.not.be.eql([]);
                        chai_1.expect(loadedTags[1].categoriesWithNonPKColumns[0].code).to.be.equal(3);
                        chai_1.expect(loadedTags[1].categoriesWithNonPKColumns[0].version).to.be.equal(1);
                        chai_1.expect(loadedTags[1].categoriesWithNonPKColumns[0].description).to.be.equal("category of airplanes");
                        return [4 /*yield*/, connection.manager
                                .createQueryBuilder(Tag_1.Tag, "tag")
                                .leftJoinAndSelect("tag.categoriesWithNonPKColumns", "categories")
                                .orderBy("categories.code")
                                .where("tag.code = :code", { code: 1 })
                                .getOne()];
                    case 7:
                        loadedTag = _a.sent();
                        chai_1.expect(loadedTag.categoriesWithNonPKColumns).to.not.be.eql([]);
                        chai_1.expect(loadedTag.categoriesWithNonPKColumns[0].code).to.be.equal(1);
                        chai_1.expect(loadedTag.categoriesWithNonPKColumns[0].version).to.be.equal(1);
                        chai_1.expect(loadedTag.categoriesWithNonPKColumns[0].description).to.be.equal("category of cars");
                        return [2 /*return*/];
                }
            });
        }); })); });
    });
    describe("inverse side", function () {
        it("should load related entity when JoinTable used without options", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var post1, post2, post3, category1, category2, loadedCategories, loadedCategory;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        post1 = new Post_1.Post();
                        post1.title = "About BMW";
                        return [4 /*yield*/, connection.manager.save(post1)];
                    case 1:
                        _a.sent();
                        post2 = new Post_1.Post();
                        post2.title = "About Audi";
                        return [4 /*yield*/, connection.manager.save(post2)];
                    case 2:
                        _a.sent();
                        post3 = new Post_1.Post();
                        post3.title = "About Boeing";
                        return [4 /*yield*/, connection.manager.save(post3)];
                    case 3:
                        _a.sent();
                        category1 = new Category_1.Category();
                        category1.name = "cars";
                        category1.type = "common-category";
                        category1.code = 1;
                        category1.version = 1;
                        category1.posts = [post1, post2];
                        return [4 /*yield*/, connection.manager.save(category1)];
                    case 4:
                        _a.sent();
                        category2 = new Category_1.Category();
                        category2.name = "airplanes";
                        category2.type = "common-category";
                        category2.code = 2;
                        category2.version = 1;
                        category2.posts = [post3];
                        return [4 /*yield*/, connection.manager.save(category2)];
                    case 5:
                        _a.sent();
                        return [4 /*yield*/, connection.manager
                                .createQueryBuilder(Category_1.Category, "category")
                                .leftJoinAndSelect("category.posts", "posts")
                                .orderBy("category.code, posts.id")
                                .getMany()];
                    case 6:
                        loadedCategories = _a.sent();
                        chai_1.expect(loadedCategories[0].posts).to.not.be.eql([]);
                        chai_1.expect(loadedCategories[0].posts[0].id).to.be.equal(1);
                        chai_1.expect(loadedCategories[0].posts[1].id).to.be.equal(2);
                        chai_1.expect(loadedCategories[1].posts).to.not.be.eql([]);
                        chai_1.expect(loadedCategories[1].posts[0].id).to.be.equal(3);
                        return [4 /*yield*/, connection.manager
                                .createQueryBuilder(Category_1.Category, "category")
                                .leftJoinAndSelect("category.posts", "posts")
                                .orderBy("posts.id")
                                .where("category.code = :code", { code: 1 })
                                .getOne()];
                    case 7:
                        loadedCategory = _a.sent();
                        chai_1.expect(loadedCategory.posts).to.not.be.eql([]);
                        chai_1.expect(loadedCategory.posts[0].id).to.be.equal(1);
                        chai_1.expect(loadedCategory.posts[1].id).to.be.equal(2);
                        return [2 /*return*/];
                }
            });
        }); })); });
        it("should load related entity when JoinTable used with options", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var post1, post2, post3, category1, category2, loadedCategories, loadedCategory;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        post1 = new Post_1.Post();
                        post1.title = "About BMW";
                        return [4 /*yield*/, connection.manager.save(post1)];
                    case 1:
                        _a.sent();
                        post2 = new Post_1.Post();
                        post2.title = "About Audi";
                        return [4 /*yield*/, connection.manager.save(post2)];
                    case 2:
                        _a.sent();
                        post3 = new Post_1.Post();
                        post3.title = "About Boeing";
                        return [4 /*yield*/, connection.manager.save(post3)];
                    case 3:
                        _a.sent();
                        category1 = new Category_1.Category();
                        category1.name = "cars";
                        category1.type = "common-category";
                        category1.code = 1;
                        category1.version = 1;
                        category1.postsWithOptions = [post1, post2];
                        return [4 /*yield*/, connection.manager.save(category1)];
                    case 4:
                        _a.sent();
                        category2 = new Category_1.Category();
                        category2.name = "airplanes";
                        category2.type = "common-category";
                        category2.code = 2;
                        category2.version = 1;
                        category2.postsWithOptions = [post3];
                        return [4 /*yield*/, connection.manager.save(category2)];
                    case 5:
                        _a.sent();
                        return [4 /*yield*/, connection.manager
                                .createQueryBuilder(Category_1.Category, "category")
                                .leftJoinAndSelect("category.postsWithOptions", "posts")
                                .orderBy("category.code, posts.id")
                                .getMany()];
                    case 6:
                        loadedCategories = _a.sent();
                        chai_1.expect(loadedCategories[0].postsWithOptions).to.not.be.eql([]);
                        chai_1.expect(loadedCategories[0].postsWithOptions[0].id).to.be.equal(1);
                        chai_1.expect(loadedCategories[0].postsWithOptions[1].id).to.be.equal(2);
                        chai_1.expect(loadedCategories[1].postsWithOptions).to.not.be.eql([]);
                        chai_1.expect(loadedCategories[1].postsWithOptions[0].id).to.be.equal(3);
                        return [4 /*yield*/, connection.manager
                                .createQueryBuilder(Category_1.Category, "category")
                                .leftJoinAndSelect("category.postsWithOptions", "posts")
                                .orderBy("posts.id")
                                .where("category.code = :code", { code: 1 })
                                .getOne()];
                    case 7:
                        loadedCategory = _a.sent();
                        chai_1.expect(loadedCategory.postsWithOptions).to.not.be.eql([]);
                        chai_1.expect(loadedCategory.postsWithOptions[0].id).to.be.equal(1);
                        chai_1.expect(loadedCategory.postsWithOptions[1].id).to.be.equal(2);
                        return [2 /*return*/];
                }
            });
        }); })); });
        it("should load related entity when JoinTable references with non-primary columns", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var post1, post2, post3, category1, category2, loadedCategories, loadedCategory;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        post1 = new Post_1.Post();
                        post1.title = "About BMW";
                        return [4 /*yield*/, connection.manager.save(post1)];
                    case 1:
                        _a.sent();
                        post2 = new Post_1.Post();
                        post2.title = "About Audi";
                        return [4 /*yield*/, connection.manager.save(post2)];
                    case 2:
                        _a.sent();
                        post3 = new Post_1.Post();
                        post3.title = "About Boeing";
                        return [4 /*yield*/, connection.manager.save(post3)];
                    case 3:
                        _a.sent();
                        category1 = new Category_1.Category();
                        category1.name = "cars";
                        category1.type = "common-category";
                        category1.code = 1;
                        category1.version = 1;
                        category1.description = "category of cars";
                        category1.postsWithNonPKColumns = [post1, post2];
                        return [4 /*yield*/, connection.manager.save(category1)];
                    case 4:
                        _a.sent();
                        category2 = new Category_1.Category();
                        category2.name = "airplanes";
                        category2.type = "common-category";
                        category2.code = 2;
                        category2.version = 1;
                        category2.description = "category of airplanes";
                        category2.postsWithNonPKColumns = [post3];
                        return [4 /*yield*/, connection.manager.save(category2)];
                    case 5:
                        _a.sent();
                        return [4 /*yield*/, connection.manager
                                .createQueryBuilder(Category_1.Category, "category")
                                .leftJoinAndSelect("category.postsWithNonPKColumns", "posts")
                                .orderBy("category.code, posts.id")
                                .getMany()];
                    case 6:
                        loadedCategories = _a.sent();
                        chai_1.expect(loadedCategories[0].postsWithNonPKColumns).to.not.be.eql([]);
                        chai_1.expect(loadedCategories[0].postsWithNonPKColumns[0].id).to.be.equal(1);
                        chai_1.expect(loadedCategories[0].postsWithNonPKColumns[1].id).to.be.equal(2);
                        chai_1.expect(loadedCategories[1].postsWithNonPKColumns).to.not.be.eql([]);
                        chai_1.expect(loadedCategories[1].postsWithNonPKColumns[0].id).to.be.equal(3);
                        return [4 /*yield*/, connection.manager
                                .createQueryBuilder(Category_1.Category, "category")
                                .leftJoinAndSelect("category.postsWithNonPKColumns", "posts")
                                .orderBy("posts.id")
                                .where("category.code = :code", { code: 1 })
                                .getOne()];
                    case 7:
                        loadedCategory = _a.sent();
                        chai_1.expect(loadedCategory.postsWithNonPKColumns).to.not.be.eql([]);
                        chai_1.expect(loadedCategory.postsWithNonPKColumns[0].id).to.be.equal(1);
                        chai_1.expect(loadedCategory.postsWithNonPKColumns[1].id).to.be.equal(2);
                        return [2 /*return*/];
                }
            });
        }); })); });
        it("should load related entity when both entities have multiple primary columns and JoinTable used without options", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var tag1, tag2, tag3, category1, category2, loadedCategories, loadedCategory;
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
                        tag2.code = 2;
                        tag2.title = "About Audi";
                        tag2.description = "Tag about Audi";
                        return [4 /*yield*/, connection.manager.save(tag2)];
                    case 2:
                        _a.sent();
                        tag3 = new Tag_1.Tag();
                        tag3.code = 3;
                        tag3.title = "About Boeing";
                        tag3.description = "tag about Boeing";
                        return [4 /*yield*/, connection.manager.save(tag3)];
                    case 3:
                        _a.sent();
                        category1 = new Category_1.Category();
                        category1.name = "cars";
                        category1.type = "common-category";
                        category1.code = 1;
                        category1.version = 1;
                        category1.tags = [tag1, tag2];
                        return [4 /*yield*/, connection.manager.save(category1)];
                    case 4:
                        _a.sent();
                        category2 = new Category_1.Category();
                        category2.name = "airplanes";
                        category2.type = "common-category";
                        category2.code = 2;
                        category2.version = 1;
                        category2.tags = [tag3];
                        return [4 /*yield*/, connection.manager.save(category2)];
                    case 5:
                        _a.sent();
                        return [4 /*yield*/, connection.manager
                                .createQueryBuilder(Category_1.Category, "category")
                                .leftJoinAndSelect("category.tags", "tags")
                                .orderBy("category.code, tags.code")
                                .getMany()];
                    case 6:
                        loadedCategories = _a.sent();
                        chai_1.expect(loadedCategories[0].tags).to.not.be.eql([]);
                        chai_1.expect(loadedCategories[0].tags[0].title).to.be.equal("About BMW");
                        chai_1.expect(loadedCategories[0].tags[0].description).to.be.equal("Tag about BMW");
                        chai_1.expect(loadedCategories[0].tags[1].title).to.be.equal("About Audi");
                        chai_1.expect(loadedCategories[0].tags[1].description).to.be.equal("Tag about Audi");
                        chai_1.expect(loadedCategories[1].tags).to.not.be.eql([]);
                        chai_1.expect(loadedCategories[1].tags[0].title).to.be.equal("About Boeing");
                        chai_1.expect(loadedCategories[1].tags[0].description).to.be.equal("tag about Boeing");
                        return [4 /*yield*/, connection.manager
                                .createQueryBuilder(Category_1.Category, "category")
                                .leftJoinAndSelect("category.tags", "tags")
                                .orderBy("tags.code")
                                .where("category.code = :code", { code: 1 })
                                .getOne()];
                    case 7:
                        loadedCategory = _a.sent();
                        chai_1.expect(loadedCategory.tags).to.not.be.eql([]);
                        chai_1.expect(loadedCategory.tags[0].title).to.be.equal("About BMW");
                        chai_1.expect(loadedCategory.tags[0].description).to.be.equal("Tag about BMW");
                        return [2 /*return*/];
                }
            });
        }); })); });
        it("should load related entity when both entities have multiple primary columns and JoinTable used with options", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var tag1, tag2, tag3, category1, category2, loadedCategories, loadedCategory;
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
                        tag2.code = 2;
                        tag2.title = "About Audi";
                        tag2.description = "Tag about Audi";
                        return [4 /*yield*/, connection.manager.save(tag2)];
                    case 2:
                        _a.sent();
                        tag3 = new Tag_1.Tag();
                        tag3.code = 3;
                        tag3.title = "About Boeing";
                        tag3.description = "tag about Boeing";
                        return [4 /*yield*/, connection.manager.save(tag3)];
                    case 3:
                        _a.sent();
                        category1 = new Category_1.Category();
                        category1.name = "cars";
                        category1.type = "common-category";
                        category1.code = 1;
                        category1.version = 1;
                        category1.tagsWithOptions = [tag1, tag2];
                        return [4 /*yield*/, connection.manager.save(category1)];
                    case 4:
                        _a.sent();
                        category2 = new Category_1.Category();
                        category2.name = "airplanes";
                        category2.type = "common-category";
                        category2.code = 2;
                        category2.version = 1;
                        category2.tagsWithOptions = [tag3];
                        return [4 /*yield*/, connection.manager.save(category2)];
                    case 5:
                        _a.sent();
                        return [4 /*yield*/, connection.manager
                                .createQueryBuilder(Category_1.Category, "category")
                                .leftJoinAndSelect("category.tagsWithOptions", "tags")
                                .orderBy("category.code, tags.code")
                                .getMany()];
                    case 6:
                        loadedCategories = _a.sent();
                        chai_1.expect(loadedCategories[0].tagsWithOptions).to.not.be.eql([]);
                        chai_1.expect(loadedCategories[0].tagsWithOptions[0].title).to.be.equal("About BMW");
                        chai_1.expect(loadedCategories[0].tagsWithOptions[0].description).to.be.equal("Tag about BMW");
                        chai_1.expect(loadedCategories[0].tagsWithOptions[1].title).to.be.equal("About Audi");
                        chai_1.expect(loadedCategories[0].tagsWithOptions[1].description).to.be.equal("Tag about Audi");
                        chai_1.expect(loadedCategories[1].tagsWithOptions).to.not.be.eql([]);
                        chai_1.expect(loadedCategories[1].tagsWithOptions[0].title).to.be.equal("About Boeing");
                        chai_1.expect(loadedCategories[1].tagsWithOptions[0].description).to.be.equal("tag about Boeing");
                        return [4 /*yield*/, connection.manager
                                .createQueryBuilder(Category_1.Category, "category")
                                .leftJoinAndSelect("category.tagsWithOptions", "tags")
                                .orderBy("tags.code")
                                .where("category.code = :code", { code: 1 })
                                .getOne()];
                    case 7:
                        loadedCategory = _a.sent();
                        chai_1.expect(loadedCategory.tagsWithOptions).to.not.be.eql([]);
                        chai_1.expect(loadedCategory.tagsWithOptions[0].title).to.be.equal("About BMW");
                        chai_1.expect(loadedCategory.tagsWithOptions[0].description).to.be.equal("Tag about BMW");
                        return [2 /*return*/];
                }
            });
        }); })); });
        it("should load related entity when both entities have multiple primary columns and JoinTable references with non-primary columns", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var tag1, tag2, tag3, category1, category2, loadedCategories, loadedCategory;
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
                        tag2.code = 2;
                        tag2.title = "About Audi";
                        tag2.description = "Tag about Audi";
                        return [4 /*yield*/, connection.manager.save(tag2)];
                    case 2:
                        _a.sent();
                        tag3 = new Tag_1.Tag();
                        tag3.code = 3;
                        tag3.title = "About Boeing";
                        tag3.description = "tag about Boeing";
                        return [4 /*yield*/, connection.manager.save(tag3)];
                    case 3:
                        _a.sent();
                        category1 = new Category_1.Category();
                        category1.name = "cars";
                        category1.type = "common-category";
                        category1.code = 1;
                        category1.version = 1;
                        category1.description = "category of cars";
                        category1.tagsWithNonPKColumns = [tag1, tag2];
                        return [4 /*yield*/, connection.manager.save(category1)];
                    case 4:
                        _a.sent();
                        category2 = new Category_1.Category();
                        category2.name = "airplanes";
                        category2.type = "common-category";
                        category2.code = 2;
                        category2.version = 1;
                        category2.description = "category of airplanes";
                        category2.tagsWithNonPKColumns = [tag3];
                        return [4 /*yield*/, connection.manager.save(category2)];
                    case 5:
                        _a.sent();
                        return [4 /*yield*/, connection.manager
                                .createQueryBuilder(Category_1.Category, "category")
                                .leftJoinAndSelect("category.tagsWithNonPKColumns", "tags")
                                .orderBy("category.code, tags.code")
                                .getMany()];
                    case 6:
                        loadedCategories = _a.sent();
                        chai_1.expect(loadedCategories[0].tagsWithNonPKColumns).to.not.be.eql([]);
                        chai_1.expect(loadedCategories[0].tagsWithNonPKColumns[0].title).to.be.equal("About BMW");
                        chai_1.expect(loadedCategories[0].tagsWithNonPKColumns[0].description).to.be.equal("Tag about BMW");
                        chai_1.expect(loadedCategories[0].tagsWithNonPKColumns[1].title).to.be.equal("About Audi");
                        chai_1.expect(loadedCategories[0].tagsWithNonPKColumns[1].description).to.be.equal("Tag about Audi");
                        chai_1.expect(loadedCategories[1].tagsWithNonPKColumns).to.not.be.eql([]);
                        chai_1.expect(loadedCategories[1].tagsWithNonPKColumns[0].title).to.be.equal("About Boeing");
                        chai_1.expect(loadedCategories[1].tagsWithNonPKColumns[0].description).to.be.equal("tag about Boeing");
                        return [4 /*yield*/, connection.manager
                                .createQueryBuilder(Category_1.Category, "category")
                                .leftJoinAndSelect("category.tagsWithNonPKColumns", "tags")
                                .orderBy("tags.code")
                                .where("category.code = :code", { code: 1 })
                                .getOne()];
                    case 7:
                        loadedCategory = _a.sent();
                        chai_1.expect(loadedCategory.tagsWithNonPKColumns).to.not.be.eql([]);
                        chai_1.expect(loadedCategory.tagsWithNonPKColumns[0].title).to.be.equal("About BMW");
                        chai_1.expect(loadedCategory.tagsWithNonPKColumns[0].description).to.be.equal("Tag about BMW");
                        return [2 /*return*/];
                }
            });
        }); })); });
    });
});
//# sourceMappingURL=multiple-primary-keys-many-to-many.js.map