"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../../../utils/test-utils");
var Post_1 = require("./entity/Post");
var Counters_1 = require("./entity/Counters");
var Information_1 = require("./entity/Information");
var ExtraInformation_1 = require("./entity/ExtraInformation");
var EditHistory_1 = require("./entity/EditHistory");
var chai_1 = require("chai");
describe("mongodb > embedded columns", function () {
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
    it("should insert / update / remove entity with embedded correctly", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var postRepository, post, loadedPost, loadedUpdatedPost, removedPost, removedUpdatedPost;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    postRepository = connection.getRepository(Post_1.Post);
                    post = new Post_1.Post();
                    post.title = "Post";
                    post.text = "Everything about post";
                    post.counters = new Counters_1.Counters();
                    post.counters.likes = 5;
                    post.counters.comments = 1;
                    post.counters.favorites = 10;
                    post.counters.information = new Information_1.Information();
                    post.counters.information.description = "Hello post";
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
                    loadedPost.counters.should.be.instanceOf(Counters_1.Counters);
                    loadedPost.counters.likes.should.be.equal(5);
                    loadedPost.counters.comments.should.be.equal(1);
                    loadedPost.counters.favorites.should.be.equal(10);
                    loadedPost.counters.information.should.be.instanceOf(Information_1.Information);
                    loadedPost.counters.information.description.should.be.equal("Hello post");
                    post.title = "Updated post";
                    post.counters.comments = 2;
                    post.counters.information.description = "Hello updated post";
                    return [4 /*yield*/, postRepository.save(post)];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, postRepository.findOne({ title: "Updated post" })];
                case 4:
                    loadedUpdatedPost = _a.sent();
                    chai_1.expect(loadedUpdatedPost).to.be.not.empty;
                    chai_1.expect(loadedUpdatedPost.counters).to.be.not.empty;
                    chai_1.expect(loadedUpdatedPost.counters.information).to.be.not.empty;
                    loadedUpdatedPost.should.be.instanceOf(Post_1.Post);
                    loadedUpdatedPost.title.should.be.equal("Updated post");
                    loadedUpdatedPost.text.should.be.equal("Everything about post");
                    loadedUpdatedPost.counters.should.be.instanceOf(Counters_1.Counters);
                    loadedUpdatedPost.counters.likes.should.be.equal(5);
                    loadedUpdatedPost.counters.comments.should.be.equal(2);
                    loadedUpdatedPost.counters.favorites.should.be.equal(10);
                    loadedUpdatedPost.counters.information.should.be.instanceOf(Information_1.Information);
                    loadedUpdatedPost.counters.information.description.should.be.equal("Hello updated post");
                    return [4 /*yield*/, postRepository.remove(post)];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, postRepository.findOne({ title: "Post" })];
                case 6:
                    removedPost = _a.sent();
                    return [4 /*yield*/, postRepository.findOne({ title: "Updated post" })];
                case 7:
                    removedUpdatedPost = _a.sent();
                    chai_1.expect(removedPost).to.be.undefined;
                    chai_1.expect(removedUpdatedPost).to.be.undefined;
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should store results in correct camelCase format", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var postRepository, post, cursor, loadedPost;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    postRepository = connection.getMongoRepository(Post_1.Post);
                    post = new Post_1.Post();
                    post.title = "Post";
                    post.text = "Everything about post";
                    post.counters = new Counters_1.Counters();
                    post.counters.likes = 5;
                    post.counters.comments = 1;
                    post.counters.favorites = 10;
                    post.counters.information = new Information_1.Information();
                    post.counters.information.description = "Hello post";
                    return [4 /*yield*/, postRepository.save(post)];
                case 1:
                    _a.sent();
                    cursor = postRepository.createCursor();
                    return [4 /*yield*/, cursor.next()];
                case 2:
                    loadedPost = _a.sent();
                    loadedPost.title.should.be.eql("Post");
                    loadedPost.text.should.be.eql("Everything about post");
                    loadedPost.counters.likes.should.be.eql(5);
                    loadedPost.counters.comments.should.be.eql(1);
                    loadedPost.counters.favorites.should.be.eql(10);
                    loadedPost.counters.information.description.should.be.eql("Hello post");
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should transform results to correct boolean value", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var postRepository, post, loadedPosts;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    postRepository = connection.getMongoRepository(Post_1.Post);
                    post = new Post_1.Post();
                    post.title = "Post #1";
                    post.text = "Everything about post";
                    post.counters = new Counters_1.Counters();
                    post.counters.likes = 5;
                    post.counters.comments = 0;
                    post.counters.favorites = 1;
                    post.counters.information = new Information_1.Information();
                    post.counters.information.description = "Hello post";
                    post.counters.information.editable = false;
                    post.counters.information.visible = true;
                    return [4 /*yield*/, postRepository.save(post)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, postRepository.find()];
                case 2:
                    loadedPosts = _a.sent();
                    loadedPosts[0].counters.comments.should.be.equal(0);
                    loadedPosts[0].counters.favorites.should.be.equal(1);
                    loadedPosts[0].counters.information.visible.should.be.equal(true);
                    loadedPosts[0].counters.information.editable.should.be.equal(false);
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should transform entity with nested embedded columns correctly", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var postRepository, post, _a, loadedPost;
        return tslib_1.__generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    postRepository = connection.getMongoRepository(Post_1.Post);
                    post = new Post_1.Post();
                    post.title = "Post #1";
                    post.text = "Everything about post";
                    post.counters = new Counters_1.Counters();
                    post.counters.likes = 5;
                    post.counters.comments = 0;
                    post.counters.favorites = 1;
                    post.counters.information = new Information_1.Information();
                    post.counters.information.description = "Hello post";
                    post.counters.extraInformation = new ExtraInformation_1.ExtraInformation();
                    post.counters.extraInformation.lastEdit = new EditHistory_1.EditHistory();
                    post.counters.extraInformation.lastEdit.title = "Old Post Title";
                    post.counters.extraInformation.lastEdit.text = "Not everything about post";
                    return [4 /*yield*/, postRepository.save(post)];
                case 1:
                    _b.sent();
                    return [4 /*yield*/, postRepository.find()];
                case 2:
                    _a = tslib_1.__read.apply(void 0, [_b.sent(), 1]), loadedPost = _a[0];
                    loadedPost.counters.comments.should.be.equal(0);
                    loadedPost.counters.favorites.should.be.equal(1);
                    loadedPost.counters.extraInformation.lastEdit.title.should.be.eql("Old Post Title");
                    loadedPost.counters.extraInformation.lastEdit.text.should.be.eql("Not everything about post");
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=mongodb-embedded-columns.js.map