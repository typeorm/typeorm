"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var chai_1 = require("chai");
var Post_1 = require("./entity/Post");
describe("github issue > #1397 Spaces at the end of values are removed when inserting", function () {
    var connections = [];
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                        enabledDrivers: ["mysql"]
                    })];
                case 1: return [2 /*return*/, connections = _a.sent()];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should not trim empty spaces when saving", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var post, loadedPost;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    post = new Post_1.Post();
                    post.title = " About My Post   ";
                    return [4 /*yield*/, connection.manager.save(post)];
                case 1:
                    _a.sent();
                    post.title.should.be.equal(" About My Post   ");
                    return [4 /*yield*/, connection.manager.findOne(Post_1.Post, { id: 1 })];
                case 2:
                    loadedPost = _a.sent();
                    chai_1.expect(loadedPost).not.to.be.undefined;
                    loadedPost.title.should.be.equal(" About My Post   ");
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-1397.js.map