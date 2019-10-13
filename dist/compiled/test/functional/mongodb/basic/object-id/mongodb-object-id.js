"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../../../utils/test-utils");
var Post_1 = require("./entity/Post");
var PostWithUnderscoreId_1 = require("./entity/PostWithUnderscoreId");
var chai_1 = require("chai");
describe("mongodb > object id columns", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [Post_1.Post, PostWithUnderscoreId_1.PostWithUnderscoreId],
                        enabledDrivers: ["mongodb"]
                    })];
                case 1: return [2 /*return*/, connections = _a.sent()];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should persist ObjectIdColumn property as _id to DB", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var postMongoRepository, post, aggArr;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    postMongoRepository = connection.getMongoRepository(Post_1.Post);
                    post = new Post_1.Post();
                    post.title = "Post";
                    return [4 /*yield*/, postMongoRepository.save(post)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, postMongoRepository.aggregate([]).toArray()];
                case 2:
                    aggArr = _a.sent();
                    chai_1.expect(aggArr[0]._id).to.be.not.undefined;
                    chai_1.expect(aggArr[0].nonIdNameOfObjectId).to.be.undefined;
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should map _id to ObjectIdColumn property and remove BD _id property", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var postMongoRepository, post;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    postMongoRepository = connection.getMongoRepository(Post_1.Post);
                    post = new Post_1.Post();
                    post.title = "Post";
                    return [4 /*yield*/, postMongoRepository.save(post)];
                case 1:
                    _a.sent();
                    chai_1.expect(post.nonIdNameOfObjectId).to.be.not.undefined;
                    chai_1.expect(post._id).to.be.undefined;
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should save and load properly if objectId property has name _id", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var postMongoRepository, post, loadedPost;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    postMongoRepository = connection.getMongoRepository(PostWithUnderscoreId_1.PostWithUnderscoreId);
                    post = new PostWithUnderscoreId_1.PostWithUnderscoreId();
                    post.title = "Post";
                    return [4 /*yield*/, postMongoRepository.save(post)];
                case 1:
                    _a.sent();
                    chai_1.expect(post._id).to.be.not.undefined;
                    return [4 /*yield*/, postMongoRepository.findOne(post._id)];
                case 2:
                    loadedPost = _a.sent();
                    chai_1.expect(loadedPost._id).to.be.not.undefined;
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should not persist entity ObjectIdColumn property in DB on update by save", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var postMongoRepository, post, aggArr;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    postMongoRepository = connection.getMongoRepository(Post_1.Post);
                    post = new Post_1.Post();
                    post.title = "Post";
                    return [4 /*yield*/, postMongoRepository.save(post)];
                case 1:
                    _a.sent();
                    post.title = "Muhaha changed title";
                    return [4 /*yield*/, postMongoRepository.save(post)];
                case 2:
                    _a.sent();
                    chai_1.expect(post.nonIdNameOfObjectId).to.be.not.undefined;
                    chai_1.expect(post._id).to.be.undefined;
                    return [4 /*yield*/, postMongoRepository.aggregate([]).toArray()];
                case 3:
                    aggArr = _a.sent();
                    chai_1.expect(aggArr[0]._id).to.be.not.undefined;
                    chai_1.expect(aggArr[0].nonIdNameOfObjectId).to.be.undefined;
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=mongodb-object-id.js.map