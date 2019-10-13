"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var chai_1 = require("chai");
var test_utils_1 = require("../../../utils/test-utils");
var Post_1 = require("./entity/Post");
describe("driver > convert raw results to entity", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [Post_1.Post],
                    })];
                case 1: return [2 /*return*/, connections = _a.sent()];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should return null value in entity property when record column is null", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var postRepository, post, loadedPost;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    postRepository = connection.getRepository(Post_1.Post);
                    post = new Post_1.Post();
                    post.id = 1;
                    return [4 /*yield*/, postRepository.save(post)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, postRepository.findOne(1)];
                case 2:
                    loadedPost = _a.sent();
                    if (loadedPost) {
                        chai_1.expect(loadedPost.isNew).to.be.equal(null);
                    }
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should return true in entity property when record column is true", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var postRepository, post, loadedPost;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    postRepository = connection.getRepository(Post_1.Post);
                    post = new Post_1.Post();
                    post.id = 1;
                    post.isNew = true;
                    return [4 /*yield*/, postRepository.save(post)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, postRepository.findOne(1)];
                case 2:
                    loadedPost = _a.sent();
                    if (loadedPost) {
                        chai_1.expect(loadedPost.isNew).to.be.equal(true);
                    }
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should return false in entity property when record column is false", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var postRepository, post, loadedPost;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    postRepository = connection.getRepository(Post_1.Post);
                    post = new Post_1.Post();
                    post.id = 1;
                    post.isNew = false;
                    return [4 /*yield*/, postRepository.save(post)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, postRepository.findOne(1)];
                case 2:
                    loadedPost = _a.sent();
                    if (loadedPost) {
                        chai_1.expect(loadedPost.isNew).to.be.equal(false);
                    }
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=convert-to-entity.js.map