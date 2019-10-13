"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var Post_1 = require("./entity/Post");
var Category_1 = require("./entity/Category");
var chai_1 = require("chai");
describe("github issues > #815 @RelationId properties are not updated after entity saving", function () {
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
    it("should work perfectly with many-to-one relation", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var post, category;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    post = new Post_1.Post();
                    post.title = "About relation id";
                    return [4 /*yield*/, connection.manager.save(post)];
                case 1:
                    _a.sent();
                    category = new Category_1.Category();
                    category.firstId = 2;
                    category.secondId = 3;
                    category.name = "relation-id-category";
                    category.post = post;
                    return [4 /*yield*/, connection.manager.save(category)];
                case 2:
                    _a.sent();
                    chai_1.expect(post).to.be.eql({
                        id: 1,
                        title: "About relation id"
                    });
                    chai_1.expect(category).to.be.eql({
                        firstId: 2,
                        secondId: 3,
                        name: "relation-id-category",
                        post: {
                            id: 1,
                            title: "About relation id"
                        },
                        postId: 1
                    });
                    category.post = null;
                    return [4 /*yield*/, connection.manager.save(category)];
                case 3:
                    _a.sent();
                    chai_1.expect(category).to.be.eql({
                        firstId: 2,
                        secondId: 3,
                        name: "relation-id-category",
                        post: null,
                        postId: null
                    });
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should work perfectly with one-to-many relation", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var category1, category2, post;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    category1 = new Category_1.Category();
                    category1.firstId = 2;
                    category1.secondId = 3;
                    category1.name = "relation-id-category1";
                    return [4 /*yield*/, connection.manager.save(category1)];
                case 1:
                    _a.sent();
                    category2 = new Category_1.Category();
                    category2.firstId = 2;
                    category2.secondId = 4;
                    category2.name = "relation-id-category2";
                    return [4 /*yield*/, connection.manager.save(category2)];
                case 2:
                    _a.sent();
                    post = new Post_1.Post();
                    post.title = "About relation id";
                    post.categories = [category1, category2];
                    return [4 /*yield*/, connection.manager.save(post)];
                case 3:
                    _a.sent();
                    chai_1.expect(category1).to.be.eql({
                        firstId: 2,
                        secondId: 3,
                        name: "relation-id-category1"
                    });
                    chai_1.expect(category2).to.be.eql({
                        firstId: 2,
                        secondId: 4,
                        name: "relation-id-category2"
                    });
                    chai_1.expect(post).to.be.eql({
                        id: 1,
                        title: "About relation id",
                        categories: [{
                                firstId: 2,
                                secondId: 3,
                                name: "relation-id-category1"
                            }, {
                                firstId: 2,
                                secondId: 4,
                                name: "relation-id-category2"
                            }],
                        categoryIds: [{
                                firstId: 2,
                                secondId: 3,
                            }, {
                                firstId: 2,
                                secondId: 4
                            }]
                    });
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should work perfectly with many-to-many relation", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var post1, post2, category1, category2;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    post1 = new Post_1.Post();
                    post1.title = "About relation id1";
                    return [4 /*yield*/, connection.manager.save(post1)];
                case 1:
                    _a.sent();
                    post2 = new Post_1.Post();
                    post2.title = "About relation id2";
                    return [4 /*yield*/, connection.manager.save(post2)];
                case 2:
                    _a.sent();
                    category1 = new Category_1.Category();
                    category1.firstId = 2;
                    category1.secondId = 3;
                    category1.manyPosts = [post1, post2];
                    category1.name = "relation-id-category1";
                    category2 = new Category_1.Category();
                    category2.firstId = 2;
                    category2.secondId = 4;
                    category2.name = "relation-id-category2";
                    category2.manyPosts = [post2];
                    return [4 /*yield*/, connection.manager.save([category1, category2])];
                case 3:
                    _a.sent();
                    chai_1.expect(post1).to.be.eql({
                        id: 1,
                        title: "About relation id1",
                    });
                    chai_1.expect(post2).to.be.eql({
                        id: 2,
                        title: "About relation id2",
                    });
                    chai_1.expect(category1).to.be.eql({
                        firstId: 2,
                        secondId: 3,
                        name: "relation-id-category1",
                        manyPosts: [{
                                id: 1,
                                title: "About relation id1",
                            }, {
                                id: 2,
                                title: "About relation id2",
                            }],
                        manyPostIds: [1, 2]
                    });
                    chai_1.expect(category2).to.be.eql({
                        firstId: 2,
                        secondId: 4,
                        name: "relation-id-category2",
                        manyPosts: [{
                                id: 2,
                                title: "About relation id2",
                            }],
                        manyPostIds: [2]
                    });
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should work perfectly with many-to-many relation (inverse side)", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var category1, category2, post;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    category1 = new Category_1.Category();
                    category1.firstId = 2;
                    category1.secondId = 3;
                    category1.name = "relation-id-category1";
                    return [4 /*yield*/, connection.manager.save(category1)];
                case 1:
                    _a.sent();
                    category2 = new Category_1.Category();
                    category2.firstId = 2;
                    category2.secondId = 4;
                    category2.name = "relation-id-category2";
                    return [4 /*yield*/, connection.manager.save(category2)];
                case 2:
                    _a.sent();
                    post = new Post_1.Post();
                    post.title = "About relation id";
                    post.manyCategories = [category1, category2];
                    return [4 /*yield*/, connection.manager.save(post)];
                case 3:
                    _a.sent();
                    chai_1.expect(category1).to.be.eql({
                        firstId: 2,
                        secondId: 3,
                        name: "relation-id-category1"
                    });
                    chai_1.expect(category2).to.be.eql({
                        firstId: 2,
                        secondId: 4,
                        name: "relation-id-category2"
                    });
                    chai_1.expect(post).to.be.eql({
                        id: 1,
                        title: "About relation id",
                        manyCategories: [{
                                firstId: 2,
                                secondId: 3,
                                name: "relation-id-category1"
                            }, {
                                firstId: 2,
                                secondId: 4,
                                name: "relation-id-category2"
                            }],
                        manyCategoryIds: [{
                                firstId: 2,
                                secondId: 3,
                            }, {
                                firstId: 2,
                                secondId: 4
                            }]
                    });
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-815.js.map