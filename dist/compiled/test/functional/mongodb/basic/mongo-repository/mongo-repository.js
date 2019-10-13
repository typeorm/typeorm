"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../../../utils/test-utils");
var Post_1 = require("./entity/Post");
var MongoRepository_1 = require("../../../../../src/repository/MongoRepository");
describe("mongodb > MongoRepository", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [Post_1.Post],
                        enabledDrivers: ["mongodb"]
                    })];
                case 1: return [2 /*return*/, connections = _a.sent()];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("connection should return mongo repository when requested", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var postRepository;
        return tslib_1.__generator(this, function (_a) {
            postRepository = connection.getMongoRepository(Post_1.Post);
            postRepository.should.be.instanceOf(MongoRepository_1.MongoRepository);
            return [2 /*return*/];
        });
    }); })); });
    it("entity manager should return mongo repository when requested", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var postRepository;
        return tslib_1.__generator(this, function (_a) {
            postRepository = connection.manager.getMongoRepository(Post_1.Post);
            postRepository.should.be.instanceOf(MongoRepository_1.MongoRepository);
            return [2 /*return*/];
        });
    }); })); });
    it("should be able to use entity cursor which will return instances of entity classes", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var postRepository, firstPost, secondPost, cursor, loadedPosts;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    postRepository = connection.getMongoRepository(Post_1.Post);
                    firstPost = new Post_1.Post();
                    firstPost.title = "Post #1";
                    firstPost.text = "Everything about post #1";
                    return [4 /*yield*/, postRepository.save(firstPost)];
                case 1:
                    _a.sent();
                    secondPost = new Post_1.Post();
                    secondPost.title = "Post #2";
                    secondPost.text = "Everything about post #2";
                    return [4 /*yield*/, postRepository.save(secondPost)];
                case 2:
                    _a.sent();
                    cursor = postRepository.createEntityCursor({
                        title: "Post #1"
                    });
                    return [4 /*yield*/, cursor.toArray()];
                case 3:
                    loadedPosts = _a.sent();
                    loadedPosts.length.should.be.equal(1);
                    loadedPosts[0].should.be.instanceOf(Post_1.Post);
                    loadedPosts[0].id.should.be.eql(firstPost.id);
                    loadedPosts[0].title.should.be.equal("Post #1");
                    loadedPosts[0].text.should.be.equal("Everything about post #1");
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should be able to use entity cursor which will return instances of entity classes", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var postRepository, firstPost, secondPost, loadedPosts;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    postRepository = connection.getMongoRepository(Post_1.Post);
                    firstPost = new Post_1.Post();
                    firstPost.title = "Post #1";
                    firstPost.text = "Everything about post #1";
                    return [4 /*yield*/, postRepository.save(firstPost)];
                case 1:
                    _a.sent();
                    secondPost = new Post_1.Post();
                    secondPost.title = "Post #2";
                    secondPost.text = "Everything about post #2";
                    return [4 /*yield*/, postRepository.save(secondPost)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, postRepository.find({
                            where: {
                                $or: [
                                    {
                                        title: "Post #1",
                                    },
                                    {
                                        text: "Everything about post #1"
                                    }
                                ]
                            }
                        })];
                case 3:
                    loadedPosts = _a.sent();
                    loadedPosts.length.should.be.equal(1);
                    loadedPosts[0].should.be.instanceOf(Post_1.Post);
                    loadedPosts[0].id.should.be.eql(firstPost.id);
                    loadedPosts[0].title.should.be.equal("Post #1");
                    loadedPosts[0].text.should.be.equal("Everything about post #1");
                    return [2 /*return*/];
            }
        });
    }); })); });
    // todo: cover other methods as well
});
//# sourceMappingURL=mongo-repository.js.map