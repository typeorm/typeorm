"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../../utils/test-utils");
var Post_1 = require("./entity/Post");
var Counters_1 = require("./entity/Counters");
describe("decorators > embedded", function () {
    var connections;
    beforeEach(function () { return test_utils_1.createTestingConnections({
        entities: [Post_1.Post, Counters_1.Counters]
    }).then(function (all) { return connections = all; }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    afterEach(function () { return test_utils_1.closeTestingConnections(connections); });
    describe("basic functionality", function () {
        var _this = this;
        it("should persist and load entities with embeddeds properly", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var postRepository, post, loadedPost;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        postRepository = connection.getRepository(Post_1.Post);
                        post = new Post_1.Post();
                        post.title = "Hello post";
                        post.text = "This is text about the post";
                        post.counters = new Counters_1.Counters();
                        post.counters.comments = 5;
                        post.counters.favorites = 2;
                        post.counters.likes = 1;
                        return [4 /*yield*/, postRepository.save(post)];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, postRepository.findOne(post.id)];
                    case 2:
                        loadedPost = (_a.sent());
                        loadedPost.id.should.be.equal(post.id);
                        loadedPost.title.should.be.equal("Hello post");
                        loadedPost.text.should.be.equal("This is text about the post");
                        loadedPost.counters.should.be.eql({
                            comments: 5,
                            favorites: 2,
                            likes: 1
                        });
                        return [2 /*return*/];
                }
            });
        }); })); });
        it("should be used with prop", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var postRepository, post1, post2, sortedPosts1, sortedPosts2;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        postRepository = connection.getRepository(Post_1.Post);
                        post1 = new Post_1.Post();
                        post1.title = "Hello post #1";
                        post1.text = "This is text about the post";
                        post1.counters = new Counters_1.Counters();
                        post1.counters.comments = 5;
                        post1.counters.favorites = 2;
                        post1.counters.likes = 1;
                        return [4 /*yield*/, postRepository.save(post1)];
                    case 1:
                        _a.sent();
                        post2 = new Post_1.Post();
                        post2.title = "Hello post #2";
                        post2.text = "This is text about the post";
                        post2.counters = new Counters_1.Counters();
                        post2.counters.comments = 6;
                        post2.counters.favorites = 1;
                        post2.counters.likes = 2;
                        return [4 /*yield*/, postRepository.save(post2)];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, postRepository
                                .createQueryBuilder("post")
                                .orderBy("post.counters.comments", "DESC")
                                .getMany()];
                    case 3:
                        sortedPosts1 = _a.sent();
                        sortedPosts1.should.be.eql([{
                                id: post2.id,
                                title: "Hello post #2",
                                text: "This is text about the post",
                                counters: {
                                    comments: 6,
                                    favorites: 1,
                                    likes: 2
                                }
                            }, {
                                id: post1.id,
                                title: "Hello post #1",
                                text: "This is text about the post",
                                counters: {
                                    comments: 5,
                                    favorites: 2,
                                    likes: 1
                                }
                            }]);
                        return [4 /*yield*/, postRepository
                                .createQueryBuilder("post")
                                .orderBy("post.counters.favorites", "DESC")
                                .getMany()];
                    case 4:
                        sortedPosts2 = _a.sent();
                        sortedPosts2.should.be.eql([{
                                id: post1.id,
                                title: "Hello post #1",
                                text: "This is text about the post",
                                counters: {
                                    comments: 5,
                                    favorites: 2,
                                    likes: 1
                                }
                            }, {
                                id: post2.id,
                                title: "Hello post #2",
                                text: "This is text about the post",
                                counters: {
                                    comments: 6,
                                    favorites: 1,
                                    likes: 2
                                }
                            }]);
                        return [2 /*return*/];
                }
            });
        }); })); });
    });
});
//# sourceMappingURL=query-builder-embedded.js.map