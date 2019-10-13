"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../../utils/test-utils");
var Post_1 = require("./entity/Post");
var chai_1 = require("chai");
describe("persistence > null and default behaviour", function () {
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
    it("should insert value if it is set", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var post, loadedPost;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    post = new Post_1.Post();
                    post.id = 1;
                    post.title = "Category saved!";
                    return [4 /*yield*/, connection.manager.save(post)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, connection.manager.findOne(Post_1.Post, 1)];
                case 2:
                    loadedPost = _a.sent();
                    chai_1.expect(loadedPost).to.exist;
                    loadedPost.should.be.eql({
                        id: 1,
                        title: "Category saved!"
                    });
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should insert default when post.title is undefined", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var post, loadedPost;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    post = new Post_1.Post();
                    post.id = 1;
                    return [4 /*yield*/, connection.manager.save(post)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, connection.manager.findOne(Post_1.Post, 1)];
                case 2:
                    loadedPost = _a.sent();
                    chai_1.expect(loadedPost).to.exist;
                    loadedPost.should.be.eql({
                        id: 1,
                        title: "hello default value"
                    });
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should insert NULL when post.title is null", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var post, loadedPost;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    post = new Post_1.Post();
                    post.id = 1;
                    post.title = null;
                    return [4 /*yield*/, connection.manager.save(post)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, connection.manager.findOne(Post_1.Post, 1)];
                case 2:
                    loadedPost = _a.sent();
                    chai_1.expect(loadedPost).to.exist;
                    loadedPost.should.be.eql({
                        id: 1,
                        title: null
                    });
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should update nothing when post.title is undefined", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var post, loadedPost;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    post = new Post_1.Post();
                    post.id = 1;
                    post.title = "Category saved!";
                    return [4 /*yield*/, connection.manager.save(post)];
                case 1:
                    _a.sent();
                    post.title = undefined;
                    return [4 /*yield*/, connection.manager.save(post)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, connection.manager.findOne(Post_1.Post, 1)];
                case 3:
                    loadedPost = _a.sent();
                    chai_1.expect(loadedPost).to.exist;
                    loadedPost.should.be.eql({
                        id: 1,
                        title: "Category saved!"
                    });
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should update to null when post.title is null", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var post, loadedPost;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    post = new Post_1.Post();
                    post.id = 1;
                    post.title = "Category saved!";
                    return [4 /*yield*/, connection.manager.save(post)];
                case 1:
                    _a.sent();
                    post.title = null;
                    return [4 /*yield*/, connection.manager.save(post)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, connection.manager.findOne(Post_1.Post, 1)];
                case 3:
                    loadedPost = _a.sent();
                    chai_1.expect(loadedPost).to.exist;
                    loadedPost.should.be.eql({
                        id: 1,
                        title: null
                    });
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=null-and-default-behaviour.js.map