"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var chai_1 = require("chai");
var test_utils_1 = require("../../utils/test-utils");
var Post_1 = require("./entity/Post");
var SqlServerDriver_1 = require("../../../src/driver/sqlserver/SqlServerDriver");
describe("github issues > #1748 PrimaryColumn combined with transformer leads to error on save", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [Post_1.Post],
                        dropSchema: true
                    })];
                case 1: return [2 /*return*/, connections = _a.sent()];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should work as expected", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var postRepository, id, post, loadedPost;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (connection.driver instanceof SqlServerDriver_1.SqlServerDriver)
                        return [2 /*return*/];
                    postRepository = connection.getRepository(Post_1.Post);
                    id = new Post_1.Uuid("6f715828-d2c6-4e96-a749-aecb9598fd69");
                    post = new Post_1.Post(id);
                    post.title = "About columns";
                    return [4 /*yield*/, postRepository.save(post)];
                case 1:
                    _a.sent();
                    // then update all its properties and save again
                    post.title = "About columns1";
                    return [4 /*yield*/, postRepository.save(post)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, postRepository.findOne({ id: id })];
                case 3:
                    loadedPost = _a.sent();
                    chai_1.expect(loadedPost.id).to.deep.eq(id);
                    chai_1.expect(loadedPost.title).to.be.equal("About columns1");
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-1748.js.map