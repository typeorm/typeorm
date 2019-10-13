"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var chai_1 = require("chai");
var test_utils_1 = require("../../../utils/test-utils");
var Post_1 = require("./entity/Post");
describe("columns > readonly functionality", function () {
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
    it("should not update columns marked with readonly property", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var postRepository, post, loadedPost;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    postRepository = connection.getRepository(Post_1.Post);
                    post = new Post_1.Post();
                    post.title = "About columns";
                    post.text = "Some text about columns";
                    post.authorName = "Umed";
                    return [4 /*yield*/, postRepository.save(post)];
                case 1:
                    _a.sent();
                    // then update all its properties and save again
                    post.title = "About columns1";
                    post.text = "Some text about columns1";
                    post.authorName = "Umed1";
                    return [4 /*yield*/, postRepository.save(post)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, postRepository.findOne(post.id)];
                case 3:
                    loadedPost = _a.sent();
                    chai_1.expect(loadedPost.title).to.be.equal("About columns1");
                    chai_1.expect(loadedPost.text).to.be.equal("Some text about columns1");
                    chai_1.expect(loadedPost.authorName).to.be.equal("Umed"); // blocked by readonly
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=columns-readonly.js.map