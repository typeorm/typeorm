"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var Post_1 = require("./entity/Post");
var chai_1 = require("chai");
describe("github issues > #3374 Synchronize issue with UUID (MySQL)", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                        subscribers: [__dirname + "/subscriber/*{.js,.ts}"],
                        enabledDrivers: ["mysql"]
                    })];
                case 1: return [2 /*return*/, connections = _a.sent()];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should not drop primary column again", function () { return Promise.all(connections.map(function (connection) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var post, loadedPost;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        post = new Post_1.Post();
                        post.id = 1;
                        post.name = "hello world";
                        return [4 /*yield*/, connection.manager.save(post)];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, connection.synchronize()];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, connection.manager.find(Post_1.Post, { name: "hello world" })];
                    case 3:
                        loadedPost = _a.sent();
                        chai_1.expect(loadedPost).to.be.not.empty;
                        return [2 /*return*/];
                }
            });
        });
    })); });
});
//# sourceMappingURL=issue-3374.js.map