"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var Post_1 = require("./entity/Post");
var chai_1 = require("chai");
describe("github issues > #80 repository.save fails when empty array is sent to the method", function () {
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
    it("should persist successfully and return persisted entity", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var post, returnedPost;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    post = new Post_1.Post();
                    post.title = "Hello Post #1";
                    return [4 /*yield*/, connection.manager.save(post)];
                case 1:
                    returnedPost = _a.sent();
                    chai_1.expect(returnedPost).not.to.be.undefined;
                    returnedPost.should.be.equal(post);
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should not fail if empty array is given to persist method", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var posts, returnedPosts;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    posts = [];
                    return [4 /*yield*/, connection.manager.save(posts)];
                case 1:
                    returnedPosts = _a.sent();
                    chai_1.expect(returnedPosts).not.to.be.undefined;
                    returnedPosts.should.be.equal(posts);
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-80.js.map