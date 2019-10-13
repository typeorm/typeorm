"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var Post_1 = require("./entity/Post");
var chai_1 = require("chai");
describe("github issues > #1147 FindOptions should be able to accept custom where condition", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                        schemaCreate: true,
                        dropSchema: true,
                    })];
                case 1: return [2 /*return*/, connections = _a.sent()];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should properly query using custom sql", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var promises, i, post1, posts;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    promises = [];
                    for (i = 1; i <= 5; i++) {
                        post1 = new Post_1.Post();
                        post1.title = "post " + i;
                        promises.push(connection.manager.save(post1));
                    }
                    return [4 /*yield*/, Promise.all(promises)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, connection.manager.find(Post_1.Post, { where: "Post.title LIKE '%3'" })];
                case 2:
                    posts = _a.sent();
                    posts.length.should.be.equal(1);
                    chai_1.expect(posts[0].title).to.be.equal("post 3");
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-1147.js.map