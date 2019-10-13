"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var Post_1 = require("./entity/Post");
var chai_1 = require("chai");
var PostCategory_1 = require("./entity/PostCategory");
describe("other issues > entity change in subscribers should affect persistence", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                        subscribers: [__dirname + "/subscriber/*{.js,.ts}"]
                    })];
                case 1: return [2 /*return*/, connections = _a.sent()];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("if entity was changed, subscriber should be take updated columns", function () { return Promise.all(connections.map(function (connection) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var category1, post, loadedPost, category2, loadedUpdatedPost;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        category1 = new PostCategory_1.PostCategory();
                        category1.name = "category #1";
                        post = new Post_1.Post();
                        post.title = "hello world";
                        post.category = category1;
                        return [4 /*yield*/, connection.manager.save(post)];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, connection.manager.findOne(Post_1.Post)];
                    case 2:
                        loadedPost = _a.sent();
                        chai_1.expect(loadedPost).not.to.be.undefined;
                        loadedPost.active.should.be.equal(false);
                        category2 = new PostCategory_1.PostCategory();
                        category2.name = "category #2";
                        loadedPost.category = category2;
                        loadedPost.active = true;
                        loadedPost.title += "!";
                        return [4 /*yield*/, connection.manager.save(loadedPost)];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, connection.manager.findOne(Post_1.Post)];
                    case 4:
                        loadedUpdatedPost = _a.sent();
                        chai_1.expect(loadedUpdatedPost).not.to.be.undefined;
                        chai_1.expect(loadedUpdatedPost.updatedColumns).to.equals(2);
                        chai_1.expect(loadedUpdatedPost.updatedRelations).to.equals(1);
                        return [4 /*yield*/, connection.manager.save(loadedPost)];
                    case 5:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    })); });
});
//# sourceMappingURL=entity-change-in-subscribers.js.map