"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var Post_1 = require("./entity/Post");
var chai_1 = require("chai");
var PostStatus_1 = require("./model/PostStatus");
describe("github issues > #182 enums are not saved properly", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                        enabledDrivers: ["mysql"] // we can properly test lazy-relations only on one platform
                    })];
                case 1: return [2 /*return*/, connections = _a.sent()];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should persist successfully with enum values", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var post1, loadedPosts1, post2, loadedPosts2, post3, loadedPosts3;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    post1 = new Post_1.Post();
                    post1.status = PostStatus_1.PostStatus.NEW;
                    post1.title = "Hello Post #1";
                    // persist
                    return [4 /*yield*/, connection.manager.save(post1)];
                case 1:
                    // persist
                    _a.sent();
                    return [4 /*yield*/, connection.manager.findOne(Post_1.Post, { where: { title: "Hello Post #1" } })];
                case 2:
                    loadedPosts1 = _a.sent();
                    chai_1.expect(loadedPosts1).not.to.be.undefined;
                    loadedPosts1.should.be.eql({
                        id: 1,
                        title: "Hello Post #1",
                        status: PostStatus_1.PostStatus.NEW
                    });
                    // remove persisted
                    return [4 /*yield*/, connection.manager.remove(post1)];
                case 3:
                    // remove persisted
                    _a.sent();
                    post2 = new Post_1.Post();
                    post2.status = PostStatus_1.PostStatus.ACTIVE;
                    post2.title = "Hello Post #1";
                    // persist
                    return [4 /*yield*/, connection.manager.save(post2)];
                case 4:
                    // persist
                    _a.sent();
                    return [4 /*yield*/, connection.manager.findOne(Post_1.Post, { where: { title: "Hello Post #1" } })];
                case 5:
                    loadedPosts2 = _a.sent();
                    chai_1.expect(loadedPosts2).not.to.be.undefined;
                    loadedPosts2.should.be.eql({
                        id: 2,
                        title: "Hello Post #1",
                        status: PostStatus_1.PostStatus.ACTIVE
                    });
                    // remove persisted
                    return [4 /*yield*/, connection.manager.remove(post2)];
                case 6:
                    // remove persisted
                    _a.sent();
                    post3 = new Post_1.Post();
                    post3.status = PostStatus_1.PostStatus.ACHIEVED;
                    post3.title = "Hello Post #1";
                    // persist
                    return [4 /*yield*/, connection.manager.save(post3)];
                case 7:
                    // persist
                    _a.sent();
                    return [4 /*yield*/, connection.manager.findOne(Post_1.Post, { where: { title: "Hello Post #1" } })];
                case 8:
                    loadedPosts3 = _a.sent();
                    chai_1.expect(loadedPosts3).not.to.be.undefined;
                    loadedPosts3.should.be.eql({
                        id: 3,
                        title: "Hello Post #1",
                        status: PostStatus_1.PostStatus.ACHIEVED
                    });
                    // remove persisted
                    return [4 /*yield*/, connection.manager.remove(post3)];
                case 9:
                    // remove persisted
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-182.js.map