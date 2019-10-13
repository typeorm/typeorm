"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var Post_1 = require("./entity/Post");
describe("github issues > #1233 column updatedDate must appear in the GROUP BY clause or be used in an aggregate function", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                        enabledDrivers: ["postgres"]
                    })];
                case 1: return [2 /*return*/, connections = _a.sent()];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should filter correctly using findByIds", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var post1, post2, _a, loadedPosts, count;
        return tslib_1.__generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    post1 = new Post_1.Post();
                    post1.name = "post #1";
                    return [4 /*yield*/, connection.manager.save(post1)];
                case 1:
                    _b.sent();
                    post2 = new Post_1.Post();
                    post2.name = "post #1";
                    return [4 /*yield*/, connection.manager.save(post2)];
                case 2:
                    _b.sent();
                    return [4 /*yield*/, connection.manager.findAndCount(Post_1.Post, {
                            skip: 1,
                            take: 1
                        })];
                case 3:
                    _a = tslib_1.__read.apply(void 0, [_b.sent(), 2]), loadedPosts = _a[0], count = _a[1];
                    loadedPosts.length.should.be.equal(1);
                    loadedPosts[0].id.should.be.equal(1);
                    count.should.be.equal(2);
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-1233.js.map