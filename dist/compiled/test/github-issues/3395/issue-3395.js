"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var Post_1 = require("./entity/Post");
describe("github issues > #3395 Transform.from does nothing when column is NULL", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [Post_1.Post]
                    })];
                case 1: return [2 /*return*/, connections = _a.sent()];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should run transform from if column is null", function () { return Promise.all(connections.map(function (connection) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var post, loadedPost;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        post = new Post_1.Post();
                        post.id = 1;
                        return [4 /*yield*/, connection.getRepository(Post_1.Post).save(post)];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, connection.getRepository(Post_1.Post).findOne(1)];
                    case 2:
                        loadedPost = _a.sent();
                        loadedPost.text.should.be.eq("This is null");
                        return [2 /*return*/];
                }
            });
        });
    })); });
});
//# sourceMappingURL=issue-3395.js.map