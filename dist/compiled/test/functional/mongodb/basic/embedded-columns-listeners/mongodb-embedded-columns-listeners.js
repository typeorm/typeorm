"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../../../utils/test-utils");
var Post_1 = require("./entity/Post");
var Counters_1 = require("./entity/Counters");
var Information_1 = require("./entity/Information");
var chai_1 = require("chai");
describe("mongodb > embedded columns listeners", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [Post_1.Post, Counters_1.Counters, Information_1.Information],
                        enabledDrivers: ["mongodb"],
                    })];
                case 1: return [2 /*return*/, connections = _a.sent()];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should work listeners in entity embeddeds correctly", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var postRepository, post, loadedPost, loadedUpdatedPost;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    postRepository = connection.getRepository(Post_1.Post);
                    post = new Post_1.Post();
                    post.title = "Post";
                    post.text = "Everything about post";
                    post.counters = new Counters_1.Counters();
                    post.counters.information = new Information_1.Information();
                    return [4 /*yield*/, postRepository.save(post)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, postRepository.findOne({ title: "Post" })];
                case 2:
                    loadedPost = _a.sent();
                    chai_1.expect(loadedPost).to.be.not.empty;
                    chai_1.expect(loadedPost.counters).to.be.not.empty;
                    chai_1.expect(loadedPost.counters.information).to.be.not.empty;
                    loadedPost.should.be.instanceOf(Post_1.Post);
                    loadedPost.title.should.be.equal("Post");
                    loadedPost.text.should.be.equal("Everything about post");
                    post.title = "Updated post";
                    return [4 /*yield*/, postRepository.save(post)];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, postRepository.findOne({ title: "Updated post" })];
                case 4:
                    loadedUpdatedPost = _a.sent();
                    chai_1.expect(loadedUpdatedPost).to.be.not.empty;
                    chai_1.expect(loadedUpdatedPost.counters).to.be.not.empty;
                    chai_1.expect(loadedUpdatedPost.counters.likes).to.be.eq(100);
                    chai_1.expect(loadedUpdatedPost.counters.information.comments).to.be.eq(1);
                    chai_1.expect(loadedUpdatedPost.counters.information.description).to.be.not.empty;
                    loadedUpdatedPost.should.be.instanceOf(Post_1.Post);
                    loadedUpdatedPost.title.should.be.equal("Updated post");
                    loadedUpdatedPost.text.should.be.equal("Everything about post");
                    return [4 /*yield*/, postRepository.remove(post)];
                case 5:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should not work listeners in entity embeddeds if property is optional", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var postRepository, post, cursor, loadedPost;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    postRepository = connection.getMongoRepository(Post_1.Post);
                    post = new Post_1.Post();
                    post.title = "Post";
                    post.text = "Everything about post";
                    return [4 /*yield*/, postRepository.save(post)];
                case 1:
                    _a.sent();
                    cursor = postRepository.createCursor();
                    return [4 /*yield*/, cursor.next()];
                case 2:
                    loadedPost = _a.sent();
                    loadedPost.title.should.be.eql("Post");
                    loadedPost.text.should.be.eql("Everything about post");
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=mongodb-embedded-columns-listeners.js.map