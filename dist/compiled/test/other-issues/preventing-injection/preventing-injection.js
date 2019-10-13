"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var Post_1 = require("./entity/Post");
var chai_1 = require("chai");
describe("other issues > preventing-injection", function () {
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
    it("should not allow selection of non-exist columns via FindOptions", function () { return Promise.all(connections.map(function (connection) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var post, postWithOnlyIdSelected;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        post = new Post_1.Post();
                        post.title = "hello";
                        return [4 /*yield*/, connection.manager.save(post)];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, connection.manager.find(Post_1.Post, {
                                select: ["id"]
                            })];
                    case 2:
                        postWithOnlyIdSelected = _a.sent();
                        postWithOnlyIdSelected.should.be.eql([{ id: 1 }]);
                        return [4 /*yield*/, connection.manager.find(Post_1.Post, {
                                select: ["(WHERE LIMIT 1)"]
                            }).should.be.rejected];
                    case 3:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    })); });
    it("should skip non-exist columns in where expression via FindOptions", function () { return Promise.all(connections.map(function (connection) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _a, post, postWithOnlyIdSelected, loadedPosts;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        post = new Post_1.Post();
                        post.title = "hello";
                        return [4 /*yield*/, connection.manager.save(post)];
                    case 1:
                        _b.sent();
                        return [4 /*yield*/, connection.manager.find(Post_1.Post, {
                                where: {
                                    title: "hello"
                                }
                            })];
                    case 2:
                        postWithOnlyIdSelected = _b.sent();
                        postWithOnlyIdSelected.should.be.eql([{ id: 1, title: "hello" }]);
                        return [4 /*yield*/, connection.manager.find(Post_1.Post, {
                                where: (_a = {
                                        id: 2
                                    },
                                    _a["(WHERE LIMIT 1)"] = "hello",
                                    _a)
                            })];
                    case 3:
                        loadedPosts = _b.sent();
                        loadedPosts.should.be.eql([]);
                        return [2 /*return*/];
                }
            });
        });
    })); });
    it("should not allow selection of non-exist columns via FindOptions", function () { return Promise.all(connections.map(function (connection) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _a, post, loadedPosts;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        post = new Post_1.Post();
                        post.title = "hello";
                        return [4 /*yield*/, connection.manager.save(post)];
                    case 1:
                        _b.sent();
                        return [4 /*yield*/, connection.manager.find(Post_1.Post, {
                                order: {
                                    title: "DESC"
                                }
                            })];
                    case 2:
                        loadedPosts = _b.sent();
                        loadedPosts.should.be.eql([{ id: 1, title: "hello" }]);
                        return [4 /*yield*/, connection.manager.find(Post_1.Post, {
                                order: (_a = {},
                                    _a["(WHERE LIMIT 1)"] = "DESC",
                                    _a)
                            }).should.be.rejected];
                    case 3:
                        _b.sent();
                        return [2 /*return*/];
                }
            });
        });
    })); });
    it("should not allow non-numeric values in skip and take via FindOptions", function () { return Promise.all(connections.map(function (connection) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, connection.manager.find(Post_1.Post, {
                            take: "(WHERE XXX)"
                        }).should.be.rejected];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, connection.manager.find(Post_1.Post, {
                                skip: "(WHERE LIMIT 1)",
                                take: "(WHERE XXX)",
                            }).should.be.rejected];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    })); });
    it("should not allow non-numeric values in skip and take in QueryBuilder", function () { return Promise.all(connections.map(function (connection) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                chai_1.expect(function () {
                    connection.manager
                        .createQueryBuilder(Post_1.Post, "post")
                        .take("(WHERE XXX)");
                }).to.throw(Error);
                chai_1.expect(function () {
                    connection.manager
                        .createQueryBuilder(Post_1.Post, "post")
                        .skip("(WHERE LIMIT 1)");
                }).to.throw(Error);
                return [2 /*return*/];
            });
        });
    })); });
    it("should not allow non-allowed values in order by in QueryBuilder", function () { return Promise.all(connections.map(function (connection) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                chai_1.expect(function () {
                    connection.manager
                        .createQueryBuilder(Post_1.Post, "post")
                        .orderBy("post.id", "MIX");
                }).to.throw(Error);
                chai_1.expect(function () {
                    connection.manager
                        .createQueryBuilder(Post_1.Post, "post")
                        .orderBy("post.id", "DESC", "SOMETHING LAST");
                }).to.throw(Error);
                return [2 /*return*/];
            });
        });
    })); });
});
//# sourceMappingURL=preventing-injection.js.map