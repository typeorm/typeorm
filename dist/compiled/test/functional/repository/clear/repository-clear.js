"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../../utils/test-utils");
var Post_1 = require("./entity/Post");
describe("repository > clear method", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [Post_1.Post],
                    })];
                case 1: return [2 /*return*/, connections = _a.sent()];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should remove everything", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var promises, i, post, loadedPosts, loadedPostsAfterClear;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    promises = [];
                    for (i = 0; i < 100; i++) {
                        post = new Post_1.Post();
                        post.id = i;
                        post.title = "post #" + i;
                        promises.push(connection.manager.save(post));
                    }
                    return [4 /*yield*/, Promise.all(promises)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, connection.manager.find(Post_1.Post)];
                case 2:
                    loadedPosts = _a.sent();
                    loadedPosts.should.be.instanceOf(Array);
                    loadedPosts.length.should.be.equal(100);
                    return [4 /*yield*/, connection.getRepository(Post_1.Post).clear()];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, connection.manager.find(Post_1.Post)];
                case 4:
                    loadedPostsAfterClear = _a.sent();
                    loadedPostsAfterClear.should.be.instanceOf(Array);
                    loadedPostsAfterClear.length.should.be.equal(0);
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("called from entity managed should remove everything as well", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var promises, i, post, loadedPosts, loadedPostsAfterClear;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    promises = [];
                    for (i = 0; i < 100; i++) {
                        post = new Post_1.Post();
                        post.id = i;
                        post.title = "post #" + i;
                        promises.push(connection.manager.save(post));
                    }
                    return [4 /*yield*/, Promise.all(promises)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, connection.manager.find(Post_1.Post)];
                case 2:
                    loadedPosts = _a.sent();
                    loadedPosts.should.be.instanceOf(Array);
                    loadedPosts.length.should.be.equal(100);
                    return [4 /*yield*/, connection.manager.clear(Post_1.Post)];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, connection.manager.find(Post_1.Post)];
                case 4:
                    loadedPostsAfterClear = _a.sent();
                    loadedPostsAfterClear.should.be.instanceOf(Array);
                    loadedPostsAfterClear.length.should.be.equal(0);
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=repository-clear.js.map