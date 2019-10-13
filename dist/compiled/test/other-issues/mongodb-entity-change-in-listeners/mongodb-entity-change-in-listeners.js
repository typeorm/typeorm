"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var Post_1 = require("./entity/Post");
var chai_1 = require("chai");
describe("other issues > mongodb entity change in listeners should affect persistence", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        enabledDrivers: ["mongodb"],
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                    })];
                case 1: return [2 /*return*/, connections = _a.sent()];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("if entity was changed in the listener, changed property should be updated in the db", function () { return Promise.all(connections.map(function (connection) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var post, loadedPost, loadedUpdatedPost;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        post = new Post_1.Post();
                        post.title = "hello";
                        return [4 /*yield*/, connection.manager.save(post)];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, connection.manager.findOne(Post_1.Post)];
                    case 2:
                        loadedPost = _a.sent();
                        chai_1.expect(loadedPost).not.to.be.undefined;
                        loadedPost.title.should.be.equal("hello");
                        // now update some property and let update listener trigger
                        loadedPost.active = true;
                        return [4 /*yield*/, connection.manager.save(loadedPost)];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, connection.manager.findOne(Post_1.Post)];
                    case 4:
                        loadedUpdatedPost = _a.sent();
                        chai_1.expect(loadedUpdatedPost).not.to.be.undefined;
                        loadedUpdatedPost.title.should.be.equal("hello!");
                        return [4 /*yield*/, connection.manager.save(loadedPost)];
                    case 5:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    })); });
    it("if entity was loaded in the listener, loaded property should be changed", function () { return Promise.all(connections.map(function (connection) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var post, loadedPost;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        post = new Post_1.Post();
                        post.title = "hello";
                        return [4 /*yield*/, connection.manager.save(post)];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, connection.manager.findOne(Post_1.Post)];
                    case 2:
                        loadedPost = _a.sent();
                        chai_1.expect(loadedPost).not.to.be.undefined;
                        loadedPost.loaded.should.be.equal(true);
                        return [4 /*yield*/, connection.manager.save(loadedPost)];
                    case 3:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    })); });
});
//# sourceMappingURL=mongodb-entity-change-in-listeners.js.map