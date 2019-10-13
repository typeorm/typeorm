"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../../utils/test-utils");
var PostEntity_1 = require("./entity/PostEntity");
var Post_1 = require("./model/Post");
describe("entity schemas > target option", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [PostEntity_1.PostEntity],
                    })];
                case 1: return [2 /*return*/, connections = _a.sent()];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should create instance of the target", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var postRepository, post;
        return tslib_1.__generator(this, function (_a) {
            postRepository = connection.getRepository(Post_1.Post);
            post = postRepository.create({
                title: "First Post",
                text: "About first post",
            });
            post.should.be.instanceof(Post_1.Post);
            return [2 /*return*/];
        });
    }); })); });
    it("should find instances of the target", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var postRepository, post, loadedPost;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    postRepository = connection.getRepository(Post_1.Post);
                    post = new Post_1.Post();
                    post.title = "First Post";
                    post.text = "About first post";
                    return [4 /*yield*/, postRepository.save(post)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, postRepository.findOne({ title: "First Post" })];
                case 2:
                    loadedPost = _a.sent();
                    loadedPost.should.be.instanceof(Post_1.Post);
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=entity-schema-target.js.map