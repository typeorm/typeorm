"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var Post_1 = require("./entity/Post");
describe("github issues > #594 WhereInIds no longer works in the latest version.", function () {
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
    it("should load entities by given simple post ids (non mixed)", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var i, post, loadedPosts;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    i = 0;
                    _a.label = 1;
                case 1:
                    if (!(i < 10)) return [3 /*break*/, 4];
                    post = new Post_1.Post();
                    post.modelId = i;
                    return [4 /*yield*/, connection.manager.save(post)];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3:
                    i++;
                    return [3 /*break*/, 1];
                case 4: return [4 /*yield*/, connection.manager
                        .createQueryBuilder(Post_1.Post, "post")
                        .whereInIds([1, 2, 5])
                        .getMany()];
                case 5:
                    loadedPosts = _a.sent();
                    loadedPosts.length.should.be.equal(3);
                    loadedPosts[0].postId.should.be.equal(1);
                    loadedPosts[1].postId.should.be.equal(2);
                    loadedPosts[2].postId.should.be.equal(5);
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-594.js.map