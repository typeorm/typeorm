"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var Post_1 = require("./entity/Post");
describe("github issues > #190 too many SQL variables when using setMaxResults in SQLite", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                        enabledDrivers: ["sqlite"] // this issue only related to sqlite
                    })];
                case 1: return [2 /*return*/, connections = _a.sent()];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should not fail if high max results is used", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var i, post1, loadedPosts;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    i = 0;
                    _a.label = 1;
                case 1:
                    if (!(i < 1000)) return [3 /*break*/, 4];
                    post1 = new Post_1.Post();
                    post1.title = "Hello Post #1";
                    return [4 /*yield*/, connection.manager.save(post1)];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3:
                    i++;
                    return [3 /*break*/, 1];
                case 4: return [4 /*yield*/, connection.manager
                        .createQueryBuilder(Post_1.Post, "post")
                        .leftJoinAndSelect("post.categories", "categories")
                        .take(1000)
                        .getMany()];
                case 5:
                    loadedPosts = _a.sent();
                    loadedPosts.length.should.be.equal(1000);
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-190.js.map