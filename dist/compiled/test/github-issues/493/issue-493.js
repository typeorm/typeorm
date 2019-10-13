"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var Post_1 = require("./entity/Post");
describe("github issues > #493 pagination should work with string primary keys", function () {
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
    it("should work perfectly with string primary keys", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var i, post, loadedPosts;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    i = 0;
                    _a.label = 1;
                case 1:
                    if (!(i < 10)) return [3 /*break*/, 4];
                    post = new Post_1.Post();
                    post.id = "post #" + i;
                    post.title = "Hello Post #" + i;
                    return [4 /*yield*/, connection.manager.save(post)];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3:
                    i++;
                    return [3 /*break*/, 1];
                case 4: return [4 /*yield*/, connection.manager
                        .createQueryBuilder(Post_1.Post, "post")
                        .take(5)
                        .skip(0)
                        .orderBy("post.id")
                        .getMany()];
                case 5:
                    loadedPosts = _a.sent();
                    loadedPosts.length.should.be.equal(5);
                    loadedPosts[0].id.should.be.equal("post #0");
                    loadedPosts[1].id.should.be.equal("post #1");
                    loadedPosts[2].id.should.be.equal("post #2");
                    loadedPosts[3].id.should.be.equal("post #3");
                    loadedPosts[4].id.should.be.equal("post #4");
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-493.js.map