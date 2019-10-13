"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var chai_1 = require("chai");
var Post_1 = require("./entity/Post");
describe("github issues > #388 skip and take with string ID don't work", function () {
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
    it("should load posts with string id successfully", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var posts, i, post, loadedPosts;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    posts = [];
                    for (i = 1; i <= 25; i++) {
                        post = new Post_1.Post();
                        post.lala_id = "post #" + i;
                        post.title = "hello post";
                        post.index = i;
                        posts.push(post);
                    }
                    return [4 /*yield*/, connection.manager.save(posts)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, connection.manager
                            .createQueryBuilder(Post_1.Post, "post")
                            .skip(5)
                            .take(10)
                            .orderBy("post.index")
                            .getMany()];
                case 2:
                    loadedPosts = _a.sent();
                    chai_1.expect(loadedPosts).to.length(10);
                    chai_1.expect(loadedPosts[0].lala_id).to.be.equal("post #6");
                    chai_1.expect(loadedPosts[9].lala_id).to.be.equal("post #15");
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-388.js.map