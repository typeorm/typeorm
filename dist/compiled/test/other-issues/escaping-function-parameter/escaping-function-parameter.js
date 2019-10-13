"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var Post_1 = require("./entity/Post");
var chai_1 = require("chai");
describe("other issues > escaping function parameter", function () {
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
    it("select query builder should ignore function-based parameters", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var post;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    post = new Post_1.Post();
                    post.title = "Super title";
                    return [4 /*yield*/, connection.manager.save(post)];
                case 1:
                    _a.sent();
                    chai_1.expect(function () {
                        return connection
                            .manager
                            .createQueryBuilder(Post_1.Post, "post")
                            .where("post.title = :title", { title: function () { return "Super title"; } })
                            .getOne();
                    }).to.throw(Error);
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("insert query builder should work with function parameters", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var post;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, connection
                        .manager
                        .getRepository(Post_1.Post)
                        .createQueryBuilder()
                        .insert()
                        .values({
                        title: function () { return "'super title'"; }
                    })
                        .execute()];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, connection.manager.findOne(Post_1.Post, { title: "super title" })];
                case 2:
                    post = _a.sent();
                    chai_1.expect(post).to.be.eql({ id: 1, title: "super title" });
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("update query builder should work with function parameters", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var post, loadedPost;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    post = new Post_1.Post();
                    post.title = "Super title";
                    return [4 /*yield*/, connection.manager.save(post)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, connection
                            .manager
                            .getRepository(Post_1.Post)
                            .createQueryBuilder()
                            .update()
                            .set({
                            title: function () { return "'super title'"; }
                        })
                            .execute()];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, connection.manager.findOne(Post_1.Post, { title: "super title" })];
                case 3:
                    loadedPost = _a.sent();
                    chai_1.expect(loadedPost).to.be.eql({ id: 1, title: "super title" });
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=escaping-function-parameter.js.map