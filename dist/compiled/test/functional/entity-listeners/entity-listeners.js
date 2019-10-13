"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var test_utils_1 = require("../../utils/test-utils");
var Post_1 = require("./entity/Post");
describe("entity-listeners", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                        dropSchema: true,
                        schemaCreate: true
                    })];
                case 1: return [2 /*return*/, connections = _a.sent()];
            }
        });
    }); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("beforeUpdate", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var post, loadedPost;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    post = new Post_1.Post();
                    post.title = "post title";
                    post.text = "post text";
                    return [4 /*yield*/, connection.manager.save(post)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, connection.getRepository(Post_1.Post).findOne(post.id)];
                case 2:
                    loadedPost = _a.sent();
                    loadedPost.title = "post title   ";
                    return [4 /*yield*/, connection.manager.save(loadedPost)];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, connection.getRepository(Post_1.Post).findOne(post.id)];
                case 4:
                    loadedPost = _a.sent();
                    loadedPost.title.should.be.equal("post title");
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=entity-listeners.js.map