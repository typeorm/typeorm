"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var chai_1 = require("chai");
var CockroachDriver_1 = require("../../../../src/driver/cockroachdb/CockroachDriver");
var test_utils_1 = require("../../../utils/test-utils");
var Tag_1 = require("./entity/Tag");
var Post_1 = require("./entity/Post");
var Category_1 = require("./entity/Category");
var Image_1 = require("./entity/Image");
var User_1 = require("./entity/User");
var Phone_1 = require("./entity/Phone");
describe("query builder > joins", function () {
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
    describe("leftJoinAndSelect", function () {
        it("should load data for all relation types", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var user, tag, image1, image2, image3, category1, category2, category3, post1, post2, loadedPosts, loadedPost;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        user = new User_1.User();
                        user.name = "Alex Messer";
                        return [4 /*yield*/, connection.manager.save(user)];
                    case 1:
                        _a.sent();
                        tag = new Tag_1.Tag();
                        tag.name = "audi";
                        return [4 /*yield*/, connection.manager.save(tag)];
                    case 2:
                        _a.sent();
                        image1 = new Image_1.Image();
                        image1.name = "image1";
                        return [4 /*yield*/, connection.manager.save(image1)];
                    case 3:
                        _a.sent();
                        image2 = new Image_1.Image();
                        image2.name = "image2";
                        return [4 /*yield*/, connection.manager.save(image2)];
                    case 4:
                        _a.sent();
                        image3 = new Image_1.Image();
                        image3.name = "image3";
                        return [4 /*yield*/, connection.manager.save(image3)];
                    case 5:
                        _a.sent();
                        category1 = new Category_1.Category();
                        category1.name = "cars";
                        category1.images = [image1, image2];
                        return [4 /*yield*/, connection.manager.save(category1)];
                    case 6:
                        _a.sent();
                        category2 = new Category_1.Category();
                        category2.name = "germany";
                        return [4 /*yield*/, connection.manager.save(category2)];
                    case 7:
                        _a.sent();
                        category3 = new Category_1.Category();
                        category3.name = "airplanes";
                        category3.images = [image3];
                        return [4 /*yield*/, connection.manager.save(category3)];
                    case 8:
                        _a.sent();
                        post1 = new Post_1.Post();
                        post1.title = "about BMW";
                        post1.categories = [category1, category2];
                        post1.tag = tag;
                        post1.author = user;
                        return [4 /*yield*/, connection.manager.save(post1)];
                    case 9:
                        _a.sent();
                        post2 = new Post_1.Post();
                        post2.title = "about Boeing";
                        post2.categories = [category3];
                        return [4 /*yield*/, connection.manager.save(post2)];
                    case 10:
                        _a.sent();
                        return [4 /*yield*/, connection.manager
                                .createQueryBuilder(Post_1.Post, "post")
                                .leftJoinAndSelect("post.tag", "tag")
                                .leftJoinAndSelect("post.author", "author")
                                .leftJoinAndSelect("post.categories", "categories")
                                .leftJoinAndSelect("categories.images", "images")
                                .getMany()];
                    case 11:
                        loadedPosts = _a.sent();
                        chai_1.expect(loadedPosts[0].tag).to.not.be.undefined;
                        chai_1.expect(loadedPosts[0].tag.id).to.be.equal(1);
                        chai_1.expect(loadedPosts[0].categories).to.not.be.eql([]);
                        chai_1.expect(loadedPosts[0].categories.length).to.be.equal(2);
                        chai_1.expect(loadedPosts[0].categories[0].images).to.not.be.eql([]);
                        chai_1.expect(loadedPosts[0].categories[0].images.length).to.be.equal(2);
                        chai_1.expect(loadedPosts[0].categories[0].images.map(function (image) { return image.id; })).to.have.members([1, 2]);
                        chai_1.expect(loadedPosts[0].author).to.not.be.undefined;
                        chai_1.expect(loadedPosts[0].author.id).to.be.equal(1);
                        chai_1.expect(loadedPosts[1].categories).to.not.be.eql([]);
                        chai_1.expect(loadedPosts[1].categories.length).to.be.equal(1);
                        chai_1.expect(loadedPosts[1].categories[0].images).to.not.be.eql([]);
                        chai_1.expect(loadedPosts[1].categories[0].images.length).to.be.equal(1);
                        chai_1.expect(loadedPosts[1].categories[0].images[0].id).to.be.equal(3);
                        return [4 /*yield*/, connection.manager
                                .createQueryBuilder(Post_1.Post, "post")
                                .leftJoinAndSelect("post.tag", "tag")
                                .leftJoinAndSelect("post.author", "author")
                                .leftJoinAndSelect("post.categories", "categories")
                                .leftJoinAndSelect("categories.images", "images")
                                .where("post.id = :id", { id: 1 })
                                .getOne()];
                    case 12:
                        loadedPost = _a.sent();
                        chai_1.expect(loadedPost.tag).to.not.be.undefined;
                        chai_1.expect(loadedPost.tag instanceof Tag_1.Tag).to.be.true;
                        chai_1.expect(loadedPost.tag.id).to.be.equal(1);
                        chai_1.expect(loadedPost.categories).to.not.be.eql([]);
                        chai_1.expect(loadedPost.categories.length).to.be.equal(2);
                        chai_1.expect(loadedPost.categories[0] instanceof Category_1.Category).to.be.true;
                        chai_1.expect(loadedPost.categories[0].id).to.be.equal(1);
                        chai_1.expect(loadedPost.categories[1].id).to.be.equal(2);
                        chai_1.expect(loadedPost.categories[0].images[0] instanceof Image_1.Image).to.be.true;
                        chai_1.expect(loadedPost.categories[0].images).to.not.be.eql([]);
                        chai_1.expect(loadedPost.categories[0].images.length).to.be.equal(2);
                        chai_1.expect(loadedPost.categories[0].images.map(function (image) { return image.id; })).to.have.members([1, 2]);
                        chai_1.expect(loadedPost.categories[1].images).to.be.eql([]);
                        chai_1.expect(loadedPost.author).to.not.be.undefined;
                        chai_1.expect(loadedPost.author instanceof User_1.User).to.be.true;
                        chai_1.expect(loadedPost.author.id).to.be.equal(1);
                        return [2 /*return*/];
                }
            });
        }); })); });
        it("should load data when additional condition used", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var image1, image2, category1, category2, post, loadedPost;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        image1 = new Image_1.Image();
                        image1.name = "image1";
                        return [4 /*yield*/, connection.manager.save(image1)];
                    case 1:
                        _a.sent();
                        image2 = new Image_1.Image();
                        image2.name = "image2";
                        return [4 /*yield*/, connection.manager.save(image2)];
                    case 2:
                        _a.sent();
                        category1 = new Category_1.Category();
                        category1.name = "cars";
                        category1.images = [image1, image2];
                        return [4 /*yield*/, connection.manager.save(category1)];
                    case 3:
                        _a.sent();
                        category2 = new Category_1.Category();
                        category2.name = "germany";
                        return [4 /*yield*/, connection.manager.save(category2)];
                    case 4:
                        _a.sent();
                        post = new Post_1.Post();
                        post.title = "about BMW";
                        post.categories = [category1, category2];
                        return [4 /*yield*/, connection.manager.save(post)];
                    case 5:
                        _a.sent();
                        return [4 /*yield*/, connection.manager
                                .createQueryBuilder(Post_1.Post, "post")
                                .leftJoinAndSelect("post.categories", "categories", "categories.id = :categoryId")
                                .leftJoinAndSelect("categories.images", "images", "images.id = :imageId")
                                .where("post.id = :id", { id: post.id })
                                .setParameters({ categoryId: 1, imageId: 2 })
                                .getOne()];
                    case 6:
                        loadedPost = _a.sent();
                        chai_1.expect(loadedPost.categories).to.not.be.eql([]);
                        chai_1.expect(loadedPost.categories.length).to.be.equal(1);
                        chai_1.expect(loadedPost.categories[0].id).to.be.equal(1);
                        chai_1.expect(loadedPost.categories[0].images).to.not.be.eql([]);
                        chai_1.expect(loadedPost.categories[0].images.length).to.be.equal(1);
                        chai_1.expect(loadedPost.categories[0].images[0].id).to.be.equal(2);
                        return [2 /*return*/];
                }
            });
        }); })); });
        it("should load data when join tables does not have direct relation", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var category, post, loadedRawPost;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        category = new Category_1.Category();
                        category.name = "cars";
                        return [4 /*yield*/, connection.manager.save(category)];
                    case 1:
                        _a.sent();
                        post = new Post_1.Post();
                        post.title = "about BMW";
                        post.categories = [category];
                        return [4 /*yield*/, connection.manager.save(post)];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, connection.manager
                                .createQueryBuilder(Post_1.Post, "post")
                                .leftJoinAndSelect("post_categories_category", "categoriesJunction", "categoriesJunction.postId = post.id")
                                .leftJoinAndSelect(Category_1.Category, "categories", "categories.id = categoriesJunction.categoryId")
                                .where("post.id = :id", { id: post.id })
                                .getRawOne()];
                    case 3:
                        loadedRawPost = _a.sent();
                        if (connection.driver instanceof CockroachDriver_1.CockroachDriver) {
                            chai_1.expect(loadedRawPost["categories_id"]).to.be.equal("1");
                        }
                        else {
                            chai_1.expect(loadedRawPost["categories_id"]).to.be.equal(1);
                        }
                        return [2 /*return*/];
                }
            });
        }); })); });
        it("should load correct number of data when ordering by joined entity columns and limiting with take", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var user1, user2, phone1, phone2, loadedUsers1;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        user1 = new User_1.User();
                        user1.id = 1;
                        user1.name = "User1";
                        user2 = new User_1.User();
                        user2.id = 2;
                        user2.name = "User2";
                        return [4 /*yield*/, connection.manager.save([user1, user2])];
                    case 1:
                        _a.sent();
                        phone1 = new Phone_1.Phone();
                        phone1.number = 1;
                        phone1.user = user2;
                        phone2 = new Phone_1.Phone();
                        phone2.number = 2;
                        phone2.user = user2;
                        return [4 /*yield*/, connection.manager.save([phone1, phone2])];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, connection.manager.createQueryBuilder(User_1.User, "user")
                                .leftJoinAndSelect("user.phones", "phone")
                                .orderBy("phone.number", "ASC")
                                .take(2)
                                .getMany()];
                    case 3:
                        loadedUsers1 = _a.sent();
                        chai_1.expect(loadedUsers1).to.be.length(2);
                        return [2 /*return*/];
                }
            });
        }); })); });
    });
    describe("innerJoinAndSelect", function () {
        it("should load only exist data for all relation types", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var user, tag, image1, image2, category1, category2, post, loadedPost;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        user = new User_1.User();
                        user.name = "Alex Messer";
                        return [4 /*yield*/, connection.manager.save(user)];
                    case 1:
                        _a.sent();
                        tag = new Tag_1.Tag();
                        tag.name = "audi";
                        return [4 /*yield*/, connection.manager.save(tag)];
                    case 2:
                        _a.sent();
                        image1 = new Image_1.Image();
                        image1.name = "image1";
                        return [4 /*yield*/, connection.manager.save(image1)];
                    case 3:
                        _a.sent();
                        image2 = new Image_1.Image();
                        image2.name = "image2";
                        return [4 /*yield*/, connection.manager.save(image2)];
                    case 4:
                        _a.sent();
                        category1 = new Category_1.Category();
                        category1.name = "cars";
                        category1.images = [image1, image2];
                        return [4 /*yield*/, connection.manager.save(category1)];
                    case 5:
                        _a.sent();
                        category2 = new Category_1.Category();
                        category2.name = "germany";
                        return [4 /*yield*/, connection.manager.save(category2)];
                    case 6:
                        _a.sent();
                        post = new Post_1.Post();
                        post.title = "about BMW";
                        post.categories = [category1, category2];
                        post.tag = tag;
                        post.author = user;
                        return [4 /*yield*/, connection.manager.save(post)];
                    case 7:
                        _a.sent();
                        return [4 /*yield*/, connection.manager
                                .createQueryBuilder(Post_1.Post, "post")
                                .innerJoinAndSelect("post.tag", "tag")
                                .innerJoinAndSelect("post.author", "author")
                                .innerJoinAndSelect("post.categories", "categories")
                                .innerJoinAndSelect("categories.images", "images")
                                .where("post.id = :id", { id: post.id })
                                .getOne()];
                    case 8:
                        loadedPost = _a.sent();
                        chai_1.expect(loadedPost.tag).to.not.be.undefined;
                        chai_1.expect(loadedPost.tag.id).to.be.equal(1);
                        chai_1.expect(loadedPost.categories).to.not.be.eql([]);
                        chai_1.expect(loadedPost.categories.length).to.be.equal(1);
                        chai_1.expect(loadedPost.categories[0].images).to.not.be.eql([]);
                        chai_1.expect(loadedPost.categories[0].images.length).to.be.equal(2);
                        chai_1.expect(loadedPost.author).to.not.be.undefined;
                        chai_1.expect(loadedPost.author.id).to.be.equal(1);
                        return [2 /*return*/];
                }
            });
        }); })); });
        it("should load data when additional condition used", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var image1, image2, category1, category2, post, loadedPost;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        image1 = new Image_1.Image();
                        image1.name = "image1";
                        return [4 /*yield*/, connection.manager.save(image1)];
                    case 1:
                        _a.sent();
                        image2 = new Image_1.Image();
                        image2.name = "image2";
                        return [4 /*yield*/, connection.manager.save(image2)];
                    case 2:
                        _a.sent();
                        category1 = new Category_1.Category();
                        category1.name = "cars";
                        category1.images = [image1, image2];
                        return [4 /*yield*/, connection.manager.save(category1)];
                    case 3:
                        _a.sent();
                        category2 = new Category_1.Category();
                        category2.name = "germany";
                        return [4 /*yield*/, connection.manager.save(category2)];
                    case 4:
                        _a.sent();
                        post = new Post_1.Post();
                        post.title = "about BMW";
                        post.categories = [category1, category2];
                        return [4 /*yield*/, connection.manager.save(post)];
                    case 5:
                        _a.sent();
                        return [4 /*yield*/, connection.manager
                                .createQueryBuilder(Post_1.Post, "post")
                                .innerJoinAndSelect("post.categories", "categories", "categories.id = :categoryId")
                                .innerJoinAndSelect("categories.images", "images", "images.id = :imageId")
                                .where("post.id = :id", { id: post.id })
                                .setParameters({ categoryId: 1, imageId: 2 })
                                .getOne()];
                    case 6:
                        loadedPost = _a.sent();
                        chai_1.expect(loadedPost.categories).to.not.be.eql([]);
                        chai_1.expect(loadedPost.categories.length).to.be.equal(1);
                        chai_1.expect(loadedPost.categories[0].id).to.be.equal(1);
                        chai_1.expect(loadedPost.categories[0].images).to.not.be.eql([]);
                        chai_1.expect(loadedPost.categories[0].images.length).to.be.equal(1);
                        chai_1.expect(loadedPost.categories[0].images[0].id).to.be.equal(2);
                        return [2 /*return*/];
                }
            });
        }); })); });
        it("should not return any result when related data does not exist", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var post, loadedPost;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        post = new Post_1.Post();
                        post.title = "about BMW";
                        return [4 /*yield*/, connection.manager.save(post)];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, connection.manager
                                .createQueryBuilder(Post_1.Post, "post")
                                .innerJoinAndSelect("post.tag", "tag")
                                .where("post.id = :id", { id: post.id })
                                .getOne()];
                    case 2:
                        loadedPost = _a.sent();
                        chai_1.expect(loadedPost).to.be.undefined;
                        return [2 /*return*/];
                }
            });
        }); })); });
    });
    describe("leftJoinAndMap", function () {
        it("should load and map selected data when entity used as join argument", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var user, tag, image1, image2, category1, category2, post, loadedPost;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        user = new User_1.User();
                        user.name = "Alex Messer";
                        return [4 /*yield*/, connection.manager.save(user)];
                    case 1:
                        _a.sent();
                        tag = new Tag_1.Tag();
                        tag.name = "audi";
                        return [4 /*yield*/, connection.manager.save(tag)];
                    case 2:
                        _a.sent();
                        image1 = new Image_1.Image();
                        image1.name = "image1";
                        return [4 /*yield*/, connection.manager.save(image1)];
                    case 3:
                        _a.sent();
                        image2 = new Image_1.Image();
                        image2.name = "image2";
                        return [4 /*yield*/, connection.manager.save(image2)];
                    case 4:
                        _a.sent();
                        category1 = new Category_1.Category();
                        category1.name = "cars";
                        return [4 /*yield*/, connection.manager.save(category1)];
                    case 5:
                        _a.sent();
                        category2 = new Category_1.Category();
                        category2.name = "germany";
                        return [4 /*yield*/, connection.manager.save(category2)];
                    case 6:
                        _a.sent();
                        post = new Post_1.Post();
                        post.title = "about BMW";
                        post.tag = tag;
                        post.author = user;
                        return [4 /*yield*/, connection.manager.save(post)];
                    case 7:
                        _a.sent();
                        return [4 /*yield*/, connection.manager
                                .createQueryBuilder(Post_1.Post, "post")
                                .leftJoinAndMapOne("post.tag", Tag_1.Tag, "tag", "tag.id = :tagId")
                                .leftJoinAndMapOne("post.author", User_1.User, "user", "user.id = :userId")
                                .leftJoinAndMapMany("post.categories", Category_1.Category, "categories", "categories.id IN (:...categoryIds)")
                                .leftJoinAndMapMany("categories.images", Image_1.Image, "image", "image.id IN (:...imageIds)")
                                .where("post.id = :id", { id: post.id })
                                .setParameters({ tagId: 1, userId: 1, categoryIds: [1, 2], imageIds: [1, 2] })
                                .getOne()];
                    case 8:
                        loadedPost = _a.sent();
                        chai_1.expect(loadedPost.tag).to.not.be.undefined;
                        chai_1.expect(loadedPost.tag.id).to.be.equal(1);
                        chai_1.expect(loadedPost.categories).to.not.be.eql([]);
                        chai_1.expect(loadedPost.categories.length).to.be.equal(2);
                        chai_1.expect(loadedPost.categories[0].images).to.not.be.eql([]);
                        chai_1.expect(loadedPost.categories[0].images.length).to.be.equal(2);
                        chai_1.expect(loadedPost.categories[0].images.map(function (image) { return image.id; })).to.have.members([1, 2]);
                        chai_1.expect(loadedPost.author).to.not.be.undefined;
                        chai_1.expect(loadedPost.author.id).to.be.equal(1);
                        return [2 /*return*/];
                }
            });
        }); })); });
        it("should load and map selected data when table name used as join argument", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var user, tag, image1, image2, category1, category2, post, loadedPost;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        user = new User_1.User();
                        user.name = "Alex Messer";
                        return [4 /*yield*/, connection.manager.save(user)];
                    case 1:
                        _a.sent();
                        tag = new Tag_1.Tag();
                        tag.name = "audi";
                        return [4 /*yield*/, connection.manager.save(tag)];
                    case 2:
                        _a.sent();
                        image1 = new Image_1.Image();
                        image1.name = "image1";
                        return [4 /*yield*/, connection.manager.save(image1)];
                    case 3:
                        _a.sent();
                        image2 = new Image_1.Image();
                        image2.name = "image2";
                        return [4 /*yield*/, connection.manager.save(image2)];
                    case 4:
                        _a.sent();
                        category1 = new Category_1.Category();
                        category1.name = "cars";
                        return [4 /*yield*/, connection.manager.save(category1)];
                    case 5:
                        _a.sent();
                        category2 = new Category_1.Category();
                        category2.name = "germany";
                        return [4 /*yield*/, connection.manager.save(category2)];
                    case 6:
                        _a.sent();
                        post = new Post_1.Post();
                        post.title = "about BMW";
                        post.tag = tag;
                        post.author = user;
                        return [4 /*yield*/, connection.manager.save(post)];
                    case 7:
                        _a.sent();
                        return [4 /*yield*/, connection.manager
                                .createQueryBuilder(Post_1.Post, "post")
                                .leftJoinAndMapOne("post.tag", "tag", "tag", "tag.id = :tagId")
                                .leftJoinAndMapOne("post.author", "user", "user", "user.id = :userId")
                                .leftJoinAndMapMany("post.categories", "category", "categories", "categories.id IN (:...categoryIds)")
                                .leftJoinAndMapMany("categories.images", "image", "image", "image.id IN (:...imageIds)")
                                .where("post.id = :id", { id: post.id })
                                .setParameters({ tagId: 1, userId: 1, categoryIds: [1, 2], imageIds: [1, 2] })
                                .getOne()];
                    case 8:
                        loadedPost = _a.sent();
                        chai_1.expect(loadedPost.tag).to.not.be.undefined;
                        chai_1.expect(loadedPost.tag.id).to.be.equal(1);
                        chai_1.expect(loadedPost.categories).to.not.be.eql([]);
                        chai_1.expect(loadedPost.categories.length).to.be.equal(2);
                        chai_1.expect(loadedPost.categories[0].images).to.not.be.eql([]);
                        chai_1.expect(loadedPost.categories[0].images.length).to.be.equal(2);
                        chai_1.expect(loadedPost.categories[0].images.map(function (image) { return image.id; })).to.have.members([1, 2]);
                        chai_1.expect(loadedPost.author).to.not.be.undefined;
                        chai_1.expect(loadedPost.author.id).to.be.equal(1);
                        return [2 /*return*/];
                }
            });
        }); })); });
        it("should load and map selected data when data will given from same entity but with different conditions", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var category1, category2, category3, post, loadedPost;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        category1 = new Category_1.Category();
                        category1.name = "cars";
                        return [4 /*yield*/, connection.manager.save(category1)];
                    case 1:
                        _a.sent();
                        category2 = new Category_1.Category();
                        category2.name = "germany";
                        return [4 /*yield*/, connection.manager.save(category2)];
                    case 2:
                        _a.sent();
                        category3 = new Category_1.Category();
                        category3.name = "bmw";
                        return [4 /*yield*/, connection.manager.save(category3)];
                    case 3:
                        _a.sent();
                        post = new Post_1.Post();
                        post.title = "about BMW";
                        return [4 /*yield*/, connection.manager.save(post)];
                    case 4:
                        _a.sent();
                        return [4 /*yield*/, connection.manager
                                .createQueryBuilder(Post_1.Post, "post")
                                .leftJoinAndMapMany("post.categories", Category_1.Category, "categories", "categories.id IN (:...categoryIds)")
                                .leftJoinAndMapMany("post.subcategories", Category_1.Category, "subcategories", "subcategories.id IN (:...subcategoryIds)")
                                .where("post.id = :id", { id: post.id })
                                .setParameters({ categoryIds: [1, 2], subcategoryIds: [3] })
                                .getOne()];
                    case 5:
                        loadedPost = _a.sent();
                        chai_1.expect(loadedPost.categories).to.not.be.eql([]);
                        chai_1.expect(loadedPost.categories.length).to.be.equal(2);
                        chai_1.expect(loadedPost.subcategories).to.not.be.eql([]);
                        chai_1.expect(loadedPost.subcategories.length).to.be.equal(1);
                        return [2 /*return*/];
                }
            });
        }); })); });
        it("should load and map selected data when data will given from same property but with different conditions", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var image1, image2, image3, image4, category1, category2, category3, category4, post, post2, loadedPosts, loadedPost;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        image1 = new Image_1.Image();
                        image1.name = "image1";
                        return [4 /*yield*/, connection.manager.save(image1)];
                    case 1:
                        _a.sent();
                        image2 = new Image_1.Image();
                        image2.name = "image2";
                        return [4 /*yield*/, connection.manager.save(image2)];
                    case 2:
                        _a.sent();
                        image3 = new Image_1.Image();
                        image3.name = "image3";
                        image3.isRemoved = true;
                        return [4 /*yield*/, connection.manager.save(image3)];
                    case 3:
                        _a.sent();
                        image4 = new Image_1.Image();
                        image4.name = "image4";
                        image4.isRemoved = true;
                        return [4 /*yield*/, connection.manager.save(image4)];
                    case 4:
                        _a.sent();
                        category1 = new Category_1.Category();
                        category1.name = "cars";
                        category1.images = [image1, image2, image3, image4];
                        return [4 /*yield*/, connection.manager.save(category1)];
                    case 5:
                        _a.sent();
                        category2 = new Category_1.Category();
                        category2.name = "germany";
                        category2.images = [image1, image2, image3, image4];
                        return [4 /*yield*/, connection.manager.save(category2)];
                    case 6:
                        _a.sent();
                        category3 = new Category_1.Category();
                        category3.name = "bmw";
                        category3.isRemoved = true;
                        category3.images = [image1, image3];
                        return [4 /*yield*/, connection.manager.save(category3)];
                    case 7:
                        _a.sent();
                        category4 = new Category_1.Category();
                        category4.name = "citroen";
                        category4.isRemoved = true;
                        category4.images = [image2, image4];
                        return [4 /*yield*/, connection.manager.save(category4)];
                    case 8:
                        _a.sent();
                        post = new Post_1.Post();
                        post.title = "about BMW";
                        post.categories = [category1, category2, category3];
                        return [4 /*yield*/, connection.manager.save(post)];
                    case 9:
                        _a.sent();
                        post2 = new Post_1.Post();
                        post2.title = "about Citroen";
                        post2.categories = [category1, category4];
                        return [4 /*yield*/, connection.manager.save(post2)];
                    case 10:
                        _a.sent();
                        return [4 /*yield*/, connection.manager
                                .createQueryBuilder(Post_1.Post, "post")
                                .leftJoinAndMapMany("post.removedCategories", "post.categories", "rc", "rc.isRemoved = :isRemoved")
                                .leftJoinAndMapMany("rc.removedImages", "rc.images", "removedImages", "removedImages.isRemoved = :isRemoved")
                                .leftJoinAndMapMany("post.subcategories", "post.categories", "subcategories", "subcategories.id IN (:...subcategoryIds)")
                                .leftJoinAndMapOne("subcategories.titleImage", "subcategories.images", "titleImage", "titleImage.id = :titleImageId")
                                .setParameters({ isRemoved: true, subcategoryIds: [1, 2], titleImageId: 1 })
                                .getMany()];
                    case 11:
                        loadedPosts = _a.sent();
                        chai_1.expect(loadedPosts[0].removedCategories).to.not.be.eql([]);
                        chai_1.expect(loadedPosts[0].removedCategories.length).to.be.equal(1);
                        chai_1.expect(loadedPosts[0].removedCategories[0].id).to.be.equal(3);
                        chai_1.expect(loadedPosts[0].removedCategories[0] instanceof Category_1.Category).to.be.true;
                        chai_1.expect(loadedPosts[0].removedCategories[0].removedImages.length).to.be.equal(1);
                        chai_1.expect(loadedPosts[0].removedCategories[0].removedImages[0] instanceof Image_1.Image).to.be.true;
                        chai_1.expect(loadedPosts[0].removedCategories[0].removedImages[0].id).to.be.equal(3);
                        chai_1.expect(loadedPosts[0].subcategories).to.not.be.eql([]);
                        chai_1.expect(loadedPosts[0].subcategories.length).to.be.equal(2);
                        chai_1.expect(loadedPosts[0].subcategories[0].titleImage.id).to.be.equal(1);
                        chai_1.expect(loadedPosts[1].removedCategories).to.not.be.eql([]);
                        chai_1.expect(loadedPosts[1].removedCategories.length).to.be.equal(1);
                        chai_1.expect(loadedPosts[1].removedCategories[0].id).to.be.equal(4);
                        chai_1.expect(loadedPosts[1].removedCategories[0] instanceof Category_1.Category).to.be.true;
                        chai_1.expect(loadedPosts[1].removedCategories[0].removedImages.length).to.be.equal(1);
                        chai_1.expect(loadedPosts[1].removedCategories[0].removedImages[0] instanceof Image_1.Image).to.be.true;
                        chai_1.expect(loadedPosts[1].removedCategories[0].removedImages[0].id).to.be.equal(4);
                        chai_1.expect(loadedPosts[1].subcategories).to.not.be.eql([]);
                        chai_1.expect(loadedPosts[1].subcategories.length).to.be.equal(1);
                        chai_1.expect(loadedPosts[1].subcategories[0].titleImage.id).to.be.equal(1);
                        return [4 /*yield*/, connection.manager
                                .createQueryBuilder(Post_1.Post, "post")
                                .leftJoinAndMapMany("post.removedCategories", "post.categories", "rc", "rc.isRemoved = :isRemoved")
                                .leftJoinAndMapMany("rc.removedImages", "rc.images", "removedImages", "removedImages.isRemoved = :isRemoved")
                                .leftJoinAndMapMany("post.subcategories", "post.categories", "subcategories", "subcategories.id IN (:...subcategoryIds)")
                                .leftJoinAndMapOne("subcategories.titleImage", "subcategories.images", "titleImage", "titleImage.id = :titleImageId")
                                .setParameters({ isRemoved: true, subcategoryIds: [1, 2], titleImageId: 1 })
                                .where("post.id = :id", { id: post.id })
                                .getOne()];
                    case 12:
                        loadedPost = _a.sent();
                        chai_1.expect(loadedPost.removedCategories).to.not.be.eql([]);
                        chai_1.expect(loadedPost.removedCategories.length).to.be.equal(1);
                        chai_1.expect(loadedPost.removedCategories[0].id).to.be.equal(3);
                        chai_1.expect(loadedPost.removedCategories[0] instanceof Category_1.Category).to.be.true;
                        chai_1.expect(loadedPost.removedCategories[0].removedImages.length).to.be.equal(1);
                        chai_1.expect(loadedPost.removedCategories[0].removedImages[0] instanceof Image_1.Image).to.be.true;
                        chai_1.expect(loadedPost.removedCategories[0].removedImages[0].id).to.be.equal(3);
                        chai_1.expect(loadedPost.subcategories).to.not.be.eql([]);
                        chai_1.expect(loadedPost.subcategories.length).to.be.equal(2);
                        chai_1.expect(loadedPost.subcategories[0].titleImage.id).to.be.equal(1);
                        return [2 /*return*/];
                }
            });
        }); })); });
    });
    describe("innerJoinAndMap", function () {
        it("should load and map selected data when entity used as join argument", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var user, tag, image1, image2, category1, category2, post, loadedPost;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        user = new User_1.User();
                        user.name = "Alex Messer";
                        return [4 /*yield*/, connection.manager.save(user)];
                    case 1:
                        _a.sent();
                        tag = new Tag_1.Tag();
                        tag.name = "audi";
                        return [4 /*yield*/, connection.manager.save(tag)];
                    case 2:
                        _a.sent();
                        image1 = new Image_1.Image();
                        image1.name = "image1";
                        return [4 /*yield*/, connection.manager.save(image1)];
                    case 3:
                        _a.sent();
                        image2 = new Image_1.Image();
                        image2.name = "image2";
                        return [4 /*yield*/, connection.manager.save(image2)];
                    case 4:
                        _a.sent();
                        category1 = new Category_1.Category();
                        category1.name = "cars";
                        return [4 /*yield*/, connection.manager.save(category1)];
                    case 5:
                        _a.sent();
                        category2 = new Category_1.Category();
                        category2.name = "germany";
                        return [4 /*yield*/, connection.manager.save(category2)];
                    case 6:
                        _a.sent();
                        post = new Post_1.Post();
                        post.title = "about BMW";
                        post.tag = tag;
                        post.author = user;
                        return [4 /*yield*/, connection.manager.save(post)];
                    case 7:
                        _a.sent();
                        return [4 /*yield*/, connection.manager
                                .createQueryBuilder(Post_1.Post, "post")
                                .innerJoinAndMapOne("post.tag", Tag_1.Tag, "tag", "tag.id = :tagId")
                                .innerJoinAndMapOne("post.author", User_1.User, "user", "user.id = :userId")
                                .innerJoinAndMapMany("post.categories", Category_1.Category, "categories", "categories.id IN (:...categoryIds)")
                                .innerJoinAndMapMany("categories.images", Image_1.Image, "image", "image.id IN (:...imageIds)")
                                .where("post.id = :id", { id: post.id })
                                .setParameters({ tagId: 1, userId: 1, categoryIds: [1, 2], imageIds: [1, 2] })
                                .getOne()];
                    case 8:
                        loadedPost = _a.sent();
                        chai_1.expect(loadedPost.tag).to.not.be.undefined;
                        chai_1.expect(loadedPost.tag.id).to.be.equal(1);
                        chai_1.expect(loadedPost.categories).to.not.be.eql([]);
                        chai_1.expect(loadedPost.categories.length).to.be.equal(2);
                        chai_1.expect(loadedPost.categories[0].images).to.not.be.eql([]);
                        chai_1.expect(loadedPost.categories[0].images.length).to.be.equal(2);
                        chai_1.expect(loadedPost.categories[0].images.map(function (image) { return image.id; })).to.have.members([1, 2]);
                        chai_1.expect(loadedPost.author).to.not.be.undefined;
                        chai_1.expect(loadedPost.author.id).to.be.equal(1);
                        return [2 /*return*/];
                }
            });
        }); })); });
        it("should load and map selected data when table name used as join argument", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var user, tag, image1, image2, category1, category2, post, loadedPost;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        user = new User_1.User();
                        user.name = "Alex Messer";
                        return [4 /*yield*/, connection.manager.save(user)];
                    case 1:
                        _a.sent();
                        tag = new Tag_1.Tag();
                        tag.name = "audi";
                        return [4 /*yield*/, connection.manager.save(tag)];
                    case 2:
                        _a.sent();
                        image1 = new Image_1.Image();
                        image1.name = "image1";
                        return [4 /*yield*/, connection.manager.save(image1)];
                    case 3:
                        _a.sent();
                        image2 = new Image_1.Image();
                        image2.name = "image2";
                        return [4 /*yield*/, connection.manager.save(image2)];
                    case 4:
                        _a.sent();
                        category1 = new Category_1.Category();
                        category1.name = "cars";
                        return [4 /*yield*/, connection.manager.save(category1)];
                    case 5:
                        _a.sent();
                        category2 = new Category_1.Category();
                        category2.name = "germany";
                        return [4 /*yield*/, connection.manager.save(category2)];
                    case 6:
                        _a.sent();
                        post = new Post_1.Post();
                        post.title = "about BMW";
                        post.tag = tag;
                        post.author = user;
                        return [4 /*yield*/, connection.manager.save(post)];
                    case 7:
                        _a.sent();
                        return [4 /*yield*/, connection.manager
                                .createQueryBuilder(Post_1.Post, "post")
                                .innerJoinAndMapOne("post.tag", "tag", "tag", "tag.id = :tagId")
                                .innerJoinAndMapOne("post.author", "user", "user", "user.id = :userId")
                                .innerJoinAndMapMany("post.categories", "category", "categories", "categories.id IN (:...categoryIds)")
                                .innerJoinAndMapMany("categories.images", "image", "image", "image.id IN (:...imageIds)")
                                .where("post.id = :id", { id: post.id })
                                .setParameters({ tagId: 1, userId: 1, categoryIds: [1, 2], imageIds: [1, 2] })
                                .getOne()];
                    case 8:
                        loadedPost = _a.sent();
                        chai_1.expect(loadedPost.tag).to.not.be.undefined;
                        chai_1.expect(loadedPost.tag.id).to.be.equal(1);
                        chai_1.expect(loadedPost.categories).to.not.be.eql([]);
                        chai_1.expect(loadedPost.categories.length).to.be.equal(2);
                        chai_1.expect(loadedPost.categories[0].images).to.not.be.eql([]);
                        chai_1.expect(loadedPost.categories[0].images.length).to.be.equal(2);
                        chai_1.expect(loadedPost.categories[0].images.map(function (image) { return image.id; })).to.have.members([1, 2]);
                        chai_1.expect(loadedPost.author).to.not.be.undefined;
                        chai_1.expect(loadedPost.author.id).to.be.equal(1);
                        return [2 /*return*/];
                }
            });
        }); })); });
        it("should load and map selected data when data will given from same entity but with different conditions", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var category1, category2, category3, post, loadedPost;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        category1 = new Category_1.Category();
                        category1.name = "cars";
                        return [4 /*yield*/, connection.manager.save(category1)];
                    case 1:
                        _a.sent();
                        category2 = new Category_1.Category();
                        category2.name = "germany";
                        return [4 /*yield*/, connection.manager.save(category2)];
                    case 2:
                        _a.sent();
                        category3 = new Category_1.Category();
                        category3.name = "bmw";
                        return [4 /*yield*/, connection.manager.save(category3)];
                    case 3:
                        _a.sent();
                        post = new Post_1.Post();
                        post.title = "about BMW";
                        return [4 /*yield*/, connection.manager.save(post)];
                    case 4:
                        _a.sent();
                        return [4 /*yield*/, connection.manager
                                .createQueryBuilder(Post_1.Post, "post")
                                .innerJoinAndMapMany("post.categories", Category_1.Category, "categories", "categories.id IN (:...categoryIds)")
                                .innerJoinAndMapMany("post.subcategories", Category_1.Category, "subcategories", "subcategories.id IN (:...subcategoryIds)")
                                .where("post.id = :id", { id: post.id })
                                .setParameters({ categoryIds: [1, 2], subcategoryIds: [3] })
                                .getOne()];
                    case 5:
                        loadedPost = _a.sent();
                        chai_1.expect(loadedPost.categories).to.not.be.eql([]);
                        chai_1.expect(loadedPost.categories.length).to.be.equal(2);
                        chai_1.expect(loadedPost.subcategories).to.not.be.eql([]);
                        chai_1.expect(loadedPost.subcategories.length).to.be.equal(1);
                        return [2 /*return*/];
                }
            });
        }); })); });
        it("should load and map selected data when data will given from same property but with different conditions", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var image1, image2, image3, image4, category1, category2, category3, category4, post, post2, loadedPosts, loadedPost;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        image1 = new Image_1.Image();
                        image1.name = "image1";
                        return [4 /*yield*/, connection.manager.save(image1)];
                    case 1:
                        _a.sent();
                        image2 = new Image_1.Image();
                        image2.name = "image2";
                        return [4 /*yield*/, connection.manager.save(image2)];
                    case 2:
                        _a.sent();
                        image3 = new Image_1.Image();
                        image3.name = "image3";
                        image3.isRemoved = true;
                        return [4 /*yield*/, connection.manager.save(image3)];
                    case 3:
                        _a.sent();
                        image4 = new Image_1.Image();
                        image4.name = "image4";
                        image4.isRemoved = true;
                        return [4 /*yield*/, connection.manager.save(image4)];
                    case 4:
                        _a.sent();
                        category1 = new Category_1.Category();
                        category1.name = "cars";
                        category1.images = [image1, image2, image3, image4];
                        return [4 /*yield*/, connection.manager.save(category1)];
                    case 5:
                        _a.sent();
                        category2 = new Category_1.Category();
                        category2.name = "germany";
                        category2.images = [image1, image2, image3, image4];
                        return [4 /*yield*/, connection.manager.save(category2)];
                    case 6:
                        _a.sent();
                        category3 = new Category_1.Category();
                        category3.name = "bmw";
                        category3.isRemoved = true;
                        category3.images = [image1, image3];
                        return [4 /*yield*/, connection.manager.save(category3)];
                    case 7:
                        _a.sent();
                        category4 = new Category_1.Category();
                        category4.name = "citroen";
                        category4.isRemoved = true;
                        category4.images = [image2, image4];
                        return [4 /*yield*/, connection.manager.save(category4)];
                    case 8:
                        _a.sent();
                        post = new Post_1.Post();
                        post.title = "about BMW";
                        post.categories = [category1, category2, category3];
                        return [4 /*yield*/, connection.manager.save(post)];
                    case 9:
                        _a.sent();
                        post2 = new Post_1.Post();
                        post2.title = "about Citroen";
                        post2.categories = [category1, category4];
                        return [4 /*yield*/, connection.manager.save(post2)];
                    case 10:
                        _a.sent();
                        return [4 /*yield*/, connection.manager
                                .createQueryBuilder(Post_1.Post, "post")
                                .leftJoinAndMapMany("post.removedCategories", "post.categories", "rc", "rc.isRemoved = :isRemoved")
                                .leftJoinAndMapMany("rc.removedImages", "rc.images", "removedImages", "removedImages.isRemoved = :isRemoved")
                                .leftJoinAndMapMany("post.subcategories", "post.categories", "subcategories", "subcategories.id IN (:...subcategoryIds)")
                                .leftJoinAndMapOne("subcategories.titleImage", "subcategories.images", "titleImage", "titleImage.id = :titleImageId")
                                .setParameters({ isRemoved: true, subcategoryIds: [1, 2], titleImageId: 1 })
                                .getMany()];
                    case 11:
                        loadedPosts = _a.sent();
                        chai_1.expect(loadedPosts[0].removedCategories).to.not.be.eql([]);
                        chai_1.expect(loadedPosts[0].removedCategories.length).to.be.equal(1);
                        chai_1.expect(loadedPosts[0].removedCategories[0].id).to.be.equal(3);
                        chai_1.expect(loadedPosts[0].removedCategories[0] instanceof Category_1.Category).to.be.true;
                        chai_1.expect(loadedPosts[0].removedCategories[0].removedImages.length).to.be.equal(1);
                        chai_1.expect(loadedPosts[0].removedCategories[0].removedImages[0] instanceof Image_1.Image).to.be.true;
                        chai_1.expect(loadedPosts[0].removedCategories[0].removedImages[0].id).to.be.equal(3);
                        chai_1.expect(loadedPosts[0].subcategories).to.not.be.eql([]);
                        chai_1.expect(loadedPosts[0].subcategories.length).to.be.equal(2);
                        chai_1.expect(loadedPosts[0].subcategories[0].titleImage.id).to.be.equal(1);
                        chai_1.expect(loadedPosts[1].removedCategories).to.not.be.eql([]);
                        chai_1.expect(loadedPosts[1].removedCategories.length).to.be.equal(1);
                        chai_1.expect(loadedPosts[1].removedCategories[0].id).to.be.equal(4);
                        chai_1.expect(loadedPosts[1].removedCategories[0] instanceof Category_1.Category).to.be.true;
                        chai_1.expect(loadedPosts[1].removedCategories[0].removedImages.length).to.be.equal(1);
                        chai_1.expect(loadedPosts[1].removedCategories[0].removedImages[0] instanceof Image_1.Image).to.be.true;
                        chai_1.expect(loadedPosts[1].removedCategories[0].removedImages[0].id).to.be.equal(4);
                        chai_1.expect(loadedPosts[1].subcategories).to.not.be.eql([]);
                        chai_1.expect(loadedPosts[1].subcategories.length).to.be.equal(1);
                        chai_1.expect(loadedPosts[1].subcategories[0].titleImage.id).to.be.equal(1);
                        return [4 /*yield*/, connection.manager
                                .createQueryBuilder(Post_1.Post, "post")
                                .innerJoinAndMapMany("post.removedCategories", "post.categories", "rc", "rc.isRemoved = :isRemoved")
                                .innerJoinAndMapMany("rc.removedImages", "rc.images", "removedImages", "removedImages.isRemoved = :isRemoved")
                                .innerJoinAndMapMany("post.subcategories", "post.categories", "subcategories", "subcategories.id IN (:...subcategoryIds)")
                                .innerJoinAndMapOne("subcategories.titleImage", "subcategories.images", "titleImage", "titleImage.id = :titleImageId")
                                .setParameters({ isRemoved: true, subcategoryIds: [1, 2], titleImageId: 1 })
                                .where("post.id = :id", { id: post.id })
                                .getOne()];
                    case 12:
                        loadedPost = _a.sent();
                        chai_1.expect(loadedPost.removedCategories).to.not.be.eql([]);
                        chai_1.expect(loadedPost.removedCategories.length).to.be.equal(1);
                        chai_1.expect(loadedPost.removedCategories[0].id).to.be.equal(3);
                        chai_1.expect(loadedPost.removedCategories[0] instanceof Category_1.Category).to.be.true;
                        chai_1.expect(loadedPost.removedCategories[0].removedImages.length).to.be.equal(1);
                        chai_1.expect(loadedPost.removedCategories[0].removedImages[0] instanceof Image_1.Image).to.be.true;
                        chai_1.expect(loadedPost.removedCategories[0].removedImages[0].id).to.be.equal(3);
                        chai_1.expect(loadedPost.subcategories).to.not.be.eql([]);
                        chai_1.expect(loadedPost.subcategories.length).to.be.equal(2);
                        chai_1.expect(loadedPost.subcategories[0].titleImage.id).to.be.equal(1);
                        return [2 /*return*/];
                }
            });
        }); })); });
        it("should not return any result when related data does not exist", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var post, loadedPost1, loadedPost2;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        post = new Post_1.Post();
                        post.title = "about BMW";
                        return [4 /*yield*/, connection.manager.save(post)];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, connection.manager
                                .createQueryBuilder(Post_1.Post, "post")
                                .innerJoinAndMapOne("post.author", User_1.User, "user", "user.id = :userId")
                                .where("post.id = :id", { id: 1 })
                                .setParameters({ userId: 1 })
                                .getOne()];
                    case 2:
                        loadedPost1 = _a.sent();
                        chai_1.expect(loadedPost1).to.be.undefined;
                        return [4 /*yield*/, connection.manager
                                .createQueryBuilder(Post_1.Post, "post")
                                .innerJoinAndMapMany("post.categories", Category_1.Category, "categories", "categories.id = :categoryId")
                                .where("post.id = :id", { id: 1 })
                                .setParameters({ categoryId: 1 })
                                .getOne()];
                    case 3:
                        loadedPost2 = _a.sent();
                        chai_1.expect(loadedPost2).to.be.undefined;
                        return [2 /*return*/];
                }
            });
        }); })); });
    });
});
//# sourceMappingURL=query-builder-joins.js.map