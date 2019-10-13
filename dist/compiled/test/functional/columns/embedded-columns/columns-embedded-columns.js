"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var chai_1 = require("chai");
var test_utils_1 = require("../../../utils/test-utils");
var SimplePost_1 = require("./entity/SimplePost");
var SimpleCounters_1 = require("./entity/SimpleCounters");
var Information_1 = require("./entity/Information");
var Post_1 = require("./entity/Post");
describe("columns > embedded columns", function () {
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
    it("should insert / update / remove entity with embedded correctly", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var postRepository, post, loadedPost, loadedUpdatedPost, removedPost, removedUpdatedPost;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    postRepository = connection.getRepository(SimplePost_1.SimplePost);
                    post = new SimplePost_1.SimplePost();
                    post.title = "Post";
                    post.text = "Everything about post";
                    post.counters = new SimpleCounters_1.SimpleCounters();
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
                    loadedPost.should.be.instanceOf(SimplePost_1.SimplePost);
                    loadedPost.title.should.be.equal("Post");
                    loadedPost.text.should.be.equal("Everything about post");
                    loadedPost.counters.should.be.instanceOf(SimpleCounters_1.SimpleCounters);
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
                    loadedUpdatedPost.should.be.instanceOf(SimplePost_1.SimplePost);
                    loadedUpdatedPost.title.should.be.equal("Updated post");
                    loadedUpdatedPost.text.should.be.equal("Everything about post");
                    loadedUpdatedPost.counters.should.be.instanceOf(SimpleCounters_1.SimpleCounters);
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
    it("should properly generate column names", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var postRepository, columns, databaseColumns;
        return tslib_1.__generator(this, function (_a) {
            postRepository = connection.getRepository(Post_1.Post);
            columns = postRepository.metadata.columns;
            databaseColumns = columns.map(function (c) { return c.databaseName; });
            chai_1.expect(databaseColumns).to.have.members([
                // Post
                // Post.id
                "id",
                // Post.title
                "title",
                // Post.text
                "text",
                // Post.counters()
                // Post.counters().likes
                "countersLikes",
                // Post.counters().comments
                "countersComments",
                // Post.counters().favorites
                "countersFavorites",
                // Post.counters().information('info').description
                "countersInfoDescr",
                // Post.counters().otherCounters('testData').description
                "countersTestDataDescr",
                // Post.counters().dataWithoutPrefix('').description
                "countersDescr",
                // Post.otherCounters('testCounters')
                // Post.otherCounters('testCounters').likes
                "testCountersLikes",
                // Post.otherCounters('testCounters').comments
                "testCountersComments",
                // Post.otherCounters('testCounters').favorites
                "testCountersFavorites",
                // Post.otherCounters('testCounters').information('info').description
                "testCountersInfoDescr",
                // Post.otherCounters('testCounters').data('data').description
                "testCountersTestDataDescr",
                // Post.otherCounters('testCounters').dataWithoutPrefix('').description
                "testCountersDescr",
                // Post.countersWithoutPrefix('')
                // Post.countersWithoutPrefix('').likes
                "likes",
                // Post.countersWithoutPrefix('').comments
                "comments",
                // Post.countersWithoutPrefix('').favorites
                "favorites",
                // Post.countersWithoutPrefix('').information('info').description
                "infoDescr",
                // Post.countersWithoutPrefix('').data('data').description
                "testDataDescr",
                // Post.countersWithoutPrefix('').dataWithoutPrefix('').description
                "descr"
            ]);
            return [2 /*return*/];
        });
    }); })); });
});
//# sourceMappingURL=columns-embedded-columns.js.map