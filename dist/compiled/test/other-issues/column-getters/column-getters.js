"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var Post_1 = require("./entity/Post");
var chai_1 = require("chai");
describe("other issues > column with getter / setter should work", function () {
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
    it("getters and setters should work correctly", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var post, loadedPost;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    post = new Post_1.Post();
                    post.title = "Super title";
                    post.text = "About this post";
                    return [4 /*yield*/, connection.manager.save(post)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, connection
                            .manager
                            .createQueryBuilder(Post_1.Post, "post")
                            .where("post.id = :id", { id: 1 })
                            .getOne()];
                case 2:
                    loadedPost = _a.sent();
                    chai_1.expect(loadedPost).not.to.be.undefined;
                    chai_1.expect(loadedPost.title).not.to.be.undefined;
                    chai_1.expect(loadedPost.text).not.to.be.undefined;
                    loadedPost.title.should.be.equal("Super title");
                    loadedPost.text.should.be.equal("About this post");
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=column-getters.js.map