"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var chai_1 = require("chai");
var Post_1 = require("./entity/Post");
var MssqlParameter_1 = require("../../../src/driver/sqlserver/MssqlParameter");
describe("github issues > #352 double precision round to int in mssql", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                        enabledDrivers: ["mssql"]
                    })];
                case 1: return [2 /*return*/, connections = _a.sent()];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("real number should be successfully stored and loaded from db including value in parameters", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var posts, i, post, loadedPost;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    posts = [];
                    for (i = 1; i <= 25; i++) {
                        post = new Post_1.Post();
                        post.id = i + 0.234567789;
                        post.title = "hello post";
                        posts.push(post);
                    }
                    return [4 /*yield*/, connection.manager.save(posts)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, connection.manager
                            .createQueryBuilder(Post_1.Post, "post")
                            .where("post.id = :id", { id: new MssqlParameter_1.MssqlParameter(1.234567789, "float") })
                            .getOne()];
                case 2:
                    loadedPost = _a.sent();
                    chai_1.expect(loadedPost).to.exist;
                    chai_1.expect(loadedPost.id).to.be.equal(1.234567789);
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-352.js.map