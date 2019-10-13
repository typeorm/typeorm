"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../../utils/test-utils");
var src_1 = require("../../../../src");
var Post_1 = require("./entity/Post");
var PostBigInt_1 = require("./entity/PostBigInt");
var UserWithEmbededEntity_1 = require("./entity/UserWithEmbededEntity");
describe("repository > increment method", function () {
    describe("basic", function () {
        var connections;
        before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                            entities: [Post_1.Post]
                        })];
                    case 1: return [2 /*return*/, connections = _a.sent()];
                }
            });
        }); });
        beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
        after(function () { return test_utils_1.closeTestingConnections(connections); });
        it("should increment value", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var post1, post2, loadedPost1, loadedPost2;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        post1 = new Post_1.Post();
                        post1.id = 1;
                        post1.title = "post #1";
                        post1.counter = 1;
                        post2 = new Post_1.Post();
                        post2.id = 2;
                        post2.title = "post #2";
                        post2.counter = 1;
                        return [4 /*yield*/, connection.manager.save([post1, post2])];
                    case 1:
                        _a.sent();
                        // increment counter of post 1
                        return [4 /*yield*/, connection
                                .getRepository(Post_1.Post)
                                .increment({ id: 1 }, "counter", 1)];
                    case 2:
                        // increment counter of post 1
                        _a.sent();
                        // increment counter of post 2
                        return [4 /*yield*/, connection
                                .manager
                                .increment(Post_1.Post, { id: 2 }, "counter", 3)];
                    case 3:
                        // increment counter of post 2
                        _a.sent();
                        return [4 /*yield*/, connection.manager.findOne(Post_1.Post, 1)];
                    case 4:
                        loadedPost1 = _a.sent();
                        loadedPost1.counter.should.be.equal(2);
                        return [4 /*yield*/, connection.manager.findOne(Post_1.Post, 2)];
                    case 5:
                        loadedPost2 = _a.sent();
                        loadedPost2.counter.should.be.equal(4);
                        return [2 /*return*/];
                }
            });
        }); })); });
        it("should accept string as input and increment value", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var post1, post2, loadedPost1, loadedPost2;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        post1 = new Post_1.Post();
                        post1.id = 1;
                        post1.title = "post #1";
                        post1.counter = 1;
                        post2 = new Post_1.Post();
                        post2.id = 2;
                        post2.title = "post #2";
                        post2.counter = 1;
                        return [4 /*yield*/, connection.manager.save([post1, post2])];
                    case 1:
                        _a.sent();
                        // increment counter of post 1
                        return [4 /*yield*/, connection
                                .getRepository(Post_1.Post)
                                .increment({ id: 1 }, "counter", "22")];
                    case 2:
                        // increment counter of post 1
                        _a.sent();
                        // increment counter of post 2
                        return [4 /*yield*/, connection
                                .manager
                                .increment(Post_1.Post, { id: 2 }, "counter", "33")];
                    case 3:
                        // increment counter of post 2
                        _a.sent();
                        return [4 /*yield*/, connection.manager.findOne(Post_1.Post, 1)];
                    case 4:
                        loadedPost1 = _a.sent();
                        loadedPost1.counter.should.be.equal(23);
                        return [4 /*yield*/, connection.manager.findOne(Post_1.Post, 2)];
                    case 5:
                        loadedPost2 = _a.sent();
                        loadedPost2.counter.should.be.equal(34);
                        return [2 /*return*/];
                }
            });
        }); })); });
        it("should return UpdateResult", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var post1, result;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        post1 = new Post_1.Post();
                        post1.id = 1;
                        post1.title = "post #1";
                        post1.counter = 1;
                        return [4 /*yield*/, connection.manager.save(post1)];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, connection
                                .getRepository(Post_1.Post)
                                .increment({ id: 1 }, "counter", 22)];
                    case 2:
                        result = _a.sent();
                        result.should.be.an.instanceOf(src_1.UpdateResult);
                        return [2 /*return*/];
                }
            });
        }); })); });
        it("should throw an error if column property path was not found", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var post1, post2;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        post1 = new Post_1.Post();
                        post1.id = 1;
                        post1.title = "post #1";
                        post1.counter = 1;
                        post2 = new Post_1.Post();
                        post2.id = 2;
                        post2.title = "post #2";
                        post2.counter = 1;
                        return [4 /*yield*/, connection.manager.save([post1, post2])];
                    case 1:
                        _a.sent();
                        // increment counter of post 1
                        return [4 /*yield*/, connection
                                .getRepository(Post_1.Post)
                                .increment({ id: 1 }, "unknownProperty", 1)
                                .should.be.rejected];
                    case 2:
                        // increment counter of post 1
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); })); });
        it("should throw an error if input value is not number", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var post1, post2;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        post1 = new Post_1.Post();
                        post1.id = 1;
                        post1.title = "post #1";
                        post1.counter = 1;
                        post2 = new Post_1.Post();
                        post2.id = 2;
                        post2.title = "post #2";
                        post2.counter = 1;
                        return [4 /*yield*/, connection.manager.save([post1, post2])];
                    case 1:
                        _a.sent();
                        // increment counter of post 1
                        return [4 /*yield*/, connection
                                .getRepository(Post_1.Post)
                                .increment({ id: 1 }, "counter", "12abc")
                                .should.be.rejected];
                    case 2:
                        // increment counter of post 1
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); })); });
    });
    describe("bigint", function () {
        var connections;
        before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                            entities: [PostBigInt_1.PostBigInt],
                            enabledDrivers: ["mysql", "mariadb", "postgres"],
                        })];
                    case 1: return [2 /*return*/, connections = _a.sent()];
                }
            });
        }); });
        beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
        after(function () { return test_utils_1.closeTestingConnections(connections); });
        it("should increment value", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var postBigInt1, postBigInt2, loadedPost1, loadedPost2;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        postBigInt1 = new PostBigInt_1.PostBigInt();
                        postBigInt1.id = 1;
                        postBigInt1.title = "post #1";
                        postBigInt1.counter = "1";
                        postBigInt2 = new PostBigInt_1.PostBigInt();
                        postBigInt2.id = 2;
                        postBigInt2.title = "post #2";
                        postBigInt2.counter = "2";
                        return [4 /*yield*/, connection.manager.save([postBigInt1, postBigInt2])];
                    case 1:
                        _a.sent();
                        // increment counter of post 1
                        return [4 /*yield*/, connection
                                .getRepository(PostBigInt_1.PostBigInt)
                                .increment({ id: 1 }, "counter", "9000000000000000000")];
                    case 2:
                        // increment counter of post 1
                        _a.sent();
                        // increment counter of post 2
                        return [4 /*yield*/, connection
                                .manager
                                .increment(PostBigInt_1.PostBigInt, { id: 2 }, "counter", "9000000000000000000")];
                    case 3:
                        // increment counter of post 2
                        _a.sent();
                        return [4 /*yield*/, connection.manager.findOne(PostBigInt_1.PostBigInt, 1)];
                    case 4:
                        loadedPost1 = _a.sent();
                        loadedPost1.counter.should.be.equal("9000000000000000001");
                        return [4 /*yield*/, connection.manager.findOne(PostBigInt_1.PostBigInt, 2)];
                    case 5:
                        loadedPost2 = _a.sent();
                        loadedPost2.counter.should.be.equal("9000000000000000002");
                        return [2 /*return*/];
                }
            });
        }); })); });
    });
    describe("embeded entities", function () {
        var connections;
        before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                            entities: [UserWithEmbededEntity_1.UserWithEmbededEntity],
                        })];
                    case 1: return [2 /*return*/, connections = _a.sent()];
                }
            });
        }); });
        beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
        after(function () { return test_utils_1.closeTestingConnections(connections); });
        it("should increment value", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var userWithEmbededEntity, loadedUser;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        userWithEmbededEntity = new UserWithEmbededEntity_1.UserWithEmbededEntity();
                        userWithEmbededEntity.id = 1;
                        return [4 /*yield*/, connection.manager.save([userWithEmbededEntity])];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, connection
                                .getRepository(UserWithEmbededEntity_1.UserWithEmbededEntity)
                                .increment({ id: 1 }, "friend.sent", 5)];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, connection.manager.findOne(UserWithEmbededEntity_1.UserWithEmbededEntity, 1)];
                    case 3:
                        loadedUser = _a.sent();
                        loadedUser.friend.sent.should.be.equal(5);
                        return [2 /*return*/];
                }
            });
        }); })); });
    });
});
//# sourceMappingURL=repository-increment.js.map