"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../../utils/test-utils");
var Post_1 = require("./entity/Post");
var Category_1 = require("./entity/Category");
var chai_1 = require("chai");
describe("persistence > many-to-one bi-directional relation", function () {
    var _this = this;
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                    })];
                case 1:
                    connections = _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should save a category with a post attached", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var post, category, loadedCategory;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    post = new Post_1.Post(1, "Hello Post");
                    return [4 /*yield*/, connection.manager.save(post)];
                case 1:
                    _a.sent();
                    category = new Category_1.Category(1, "Hello Category");
                    category.post = post;
                    return [4 /*yield*/, connection.manager.save(category)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, connection.manager.findOne(Category_1.Category, 1, { relations: ["post"] })];
                case 3:
                    loadedCategory = _a.sent();
                    chai_1.expect(loadedCategory).not.to.be.undefined;
                    loadedCategory.should.be.eql({ id: 1, name: "Hello Category", post: { id: 1, title: "Hello Post" } });
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should save a category and a new post by cascades", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var post, category, loadedCategory;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    post = new Post_1.Post(1, "Hello Post");
                    category = new Category_1.Category(1, "Hello Category");
                    category.post = post;
                    return [4 /*yield*/, connection.manager.save(category)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, connection.manager.findOne(Category_1.Category, 1, { relations: ["post"] })];
                case 2:
                    loadedCategory = _a.sent();
                    chai_1.expect(loadedCategory).not.to.be.undefined;
                    loadedCategory.should.be.eql({ id: 1, name: "Hello Category", post: { id: 1, title: "Hello Post" } });
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should update exist post by cascades when category is saved", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var post, category, loadedCategory1, loadedCategory2;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    post = new Post_1.Post(1, "Hello Post");
                    return [4 /*yield*/, connection.manager.save(post)];
                case 1:
                    _a.sent();
                    category = new Category_1.Category(1, "Hello Category");
                    category.post = post;
                    post.title = "Updated post";
                    return [4 /*yield*/, connection.manager.save(category)];
                case 2:
                    _a.sent();
                    // save once again, just for fun
                    return [4 /*yield*/, connection.manager.save(category)];
                case 3:
                    // save once again, just for fun
                    _a.sent();
                    return [4 /*yield*/, connection.manager.findOne(Category_1.Category, 1, { relations: ["post"] })];
                case 4:
                    loadedCategory1 = _a.sent();
                    chai_1.expect(loadedCategory1).not.to.be.undefined;
                    loadedCategory1.should.be.eql({ id: 1, name: "Hello Category", post: { id: 1, title: "Updated post" } });
                    // update post from loaded category
                    loadedCategory1.post.title = "Again Updated post";
                    return [4 /*yield*/, connection.manager.save(loadedCategory1)];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, connection.manager.findOne(Category_1.Category, 1, { relations: ["post"] })];
                case 6:
                    loadedCategory2 = _a.sent();
                    chai_1.expect(loadedCategory2).not.to.be.undefined;
                    loadedCategory2.should.be.eql({ id: 1, name: "Hello Category", post: { id: 1, title: "Again Updated post" } });
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should NOT remove exist post by cascades when category is saved without a post (post is set to undefined)", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var post, category, loadedCategory1, loadedCategory2, loadedPost;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    post = new Post_1.Post(1, "Hello Post");
                    return [4 /*yield*/, connection.manager.save(post)];
                case 1:
                    _a.sent();
                    category = new Category_1.Category(1, "Hello Category");
                    category.post = post;
                    return [4 /*yield*/, connection.manager.save(category)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, connection.manager.findOne(Category_1.Category, 1, { relations: ["post"] })];
                case 3:
                    loadedCategory1 = _a.sent();
                    chai_1.expect(loadedCategory1).not.to.be.undefined;
                    loadedCategory1.should.be.eql({ id: 1, name: "Hello Category", post: { id: 1, title: "Hello Post" } });
                    // remove post from loaded category
                    loadedCategory1.post = undefined;
                    return [4 /*yield*/, connection.manager.save(loadedCategory1)];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, connection.manager.findOne(Category_1.Category, 1, { relations: ["post"] })];
                case 5:
                    loadedCategory2 = _a.sent();
                    chai_1.expect(loadedCategory2).not.to.be.undefined;
                    loadedCategory2.should.be.eql({ id: 1, name: "Hello Category", post: { id: 1, title: "Hello Post" } });
                    return [4 /*yield*/, connection.manager.findOne(Post_1.Post, 1)];
                case 6:
                    loadedPost = _a.sent();
                    chai_1.expect(loadedPost).not.to.be.undefined;
                    loadedPost.should.be.eql({ id: 1, title: "Hello Post" });
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should unset exist post when its set to null", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var post, category, loadedCategory1, loadedCategory2;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    post = new Post_1.Post(1, "Hello Post");
                    return [4 /*yield*/, connection.manager.save(post)];
                case 1:
                    _a.sent();
                    category = new Category_1.Category(1, "Hello Category");
                    category.post = post;
                    return [4 /*yield*/, connection.manager.save(category)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, connection.manager.findOne(Category_1.Category, 1, { relations: ["post"] })];
                case 3:
                    loadedCategory1 = _a.sent();
                    chai_1.expect(loadedCategory1).not.to.be.undefined;
                    loadedCategory1.should.be.eql({ id: 1, name: "Hello Category", post: { id: 1, title: "Hello Post" } });
                    // remove post from loaded category
                    loadedCategory1.post = null;
                    return [4 /*yield*/, connection.manager.save(loadedCategory1)];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, connection.manager.findOne(Category_1.Category, 1, { relations: ["post"] })];
                case 5:
                    loadedCategory2 = _a.sent();
                    chai_1.expect(loadedCategory2).not.to.be.undefined;
                    loadedCategory2.should.be.eql({ id: 1, name: "Hello Category", post: null });
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should set category's post to NULL when post is removed from the database (database ON DELETE)", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var post, category, loadedCategory1, loadedCategory2;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    post = new Post_1.Post(1, "Hello Post");
                    return [4 /*yield*/, connection.manager.save(post)];
                case 1:
                    _a.sent();
                    category = new Category_1.Category(1, "Hello Category");
                    category.post = post;
                    return [4 /*yield*/, connection.manager.save(category)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, connection.manager.findOne(Category_1.Category, 1, { relations: ["post"] })];
                case 3:
                    loadedCategory1 = _a.sent();
                    chai_1.expect(loadedCategory1).not.to.be.undefined;
                    loadedCategory1.should.be.eql({ id: 1, name: "Hello Category", post: { id: 1, title: "Hello Post" } });
                    // remove post from loaded category
                    return [4 /*yield*/, connection.manager.remove(post)];
                case 4:
                    // remove post from loaded category
                    _a.sent();
                    return [4 /*yield*/, connection.manager.findOne(Category_1.Category, 1, { relations: ["post"] })];
                case 5:
                    loadedCategory2 = _a.sent();
                    chai_1.expect(loadedCategory2).not.to.be.undefined;
                    loadedCategory2.should.be.eql({ id: 1, name: "Hello Category", post: null });
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should work when relation id is directly set into relation (without related object)", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var post1, post2, category, loadedCategory1, loadedCategory2;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    post1 = new Post_1.Post(1, "Hello Post #1");
                    return [4 /*yield*/, connection.manager.save(post1)];
                case 1:
                    _a.sent();
                    post2 = new Post_1.Post(2, "Hello Post #2");
                    return [4 /*yield*/, connection.manager.save(post2)];
                case 2:
                    _a.sent();
                    category = new Category_1.Category(1, "Hello Category");
                    category.post = 1;
                    return [4 /*yield*/, connection.manager.save(category)];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, connection.manager.findOne(Category_1.Category, 1, { relations: ["post"] })];
                case 4:
                    loadedCategory1 = _a.sent();
                    chai_1.expect(loadedCategory1).not.to.be.undefined;
                    loadedCategory1.should.be.eql({ id: 1, name: "Hello Category", post: { id: 1, title: "Hello Post #1" } });
                    // now update a category with another post
                    category.post = 2;
                    return [4 /*yield*/, connection.manager.save(category)];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, connection.manager.findOne(Category_1.Category, 1, { relations: ["post"] })];
                case 6:
                    loadedCategory2 = _a.sent();
                    chai_1.expect(loadedCategory2).not.to.be.undefined;
                    loadedCategory2.should.be.eql({ id: 1, name: "Hello Category", post: { id: 2, title: "Hello Post #2" } });
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=persistence-many-to-one-bi-directional.js.map