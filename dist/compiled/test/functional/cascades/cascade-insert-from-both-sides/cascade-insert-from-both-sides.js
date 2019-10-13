"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../../utils/test-utils");
var Post_1 = require("./entity/Post");
var PostDetails_1 = require("./entity/PostDetails");
describe("cascades > should insert by cascades from both sides (#57)", function () {
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
    it("should insert by cascades from owner side", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var details, post1, posts;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    details = new PostDetails_1.PostDetails();
                    details.keyword = "post-1";
                    post1 = new Post_1.Post();
                    post1.title = "Hello Post #1";
                    post1.details = details;
                    return [4 /*yield*/, connection.manager.save(post1)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, connection.manager.find(Post_1.Post, {
                            join: {
                                alias: "post",
                                innerJoinAndSelect: {
                                    details: "post.details"
                                }
                            }
                        })];
                case 2:
                    posts = _a.sent();
                    posts.should.be.eql([{
                            key: post1.key,
                            title: post1.title,
                            details: {
                                keyword: "post-1"
                            }
                        }]);
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=cascade-insert-from-both-sides.js.map