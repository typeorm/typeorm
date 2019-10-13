"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../../utils/test-utils");
var PostEntity_1 = require("./entity/PostEntity");
var CategoryEntity_1 = require("./entity/CategoryEntity");
describe("entity schemas > basic functionality", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [
                            PostEntity_1.PostEntity,
                            CategoryEntity_1.CategoryEntity
                        ],
                    })];
                case 1: return [2 /*return*/, connections = _a.sent()];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should perform basic operations with entity", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var postRepository, post, loadedPost;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    postRepository = connection.getRepository(PostEntity_1.PostEntity);
                    post = postRepository.create({
                        title: "First Post",
                        text: "About first post",
                    });
                    return [4 /*yield*/, postRepository.save(post)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, connection.manager.findOne(PostEntity_1.PostEntity, { title: "First Post" })];
                case 2:
                    loadedPost = _a.sent();
                    loadedPost.id.should.be.equal(post.id);
                    loadedPost.title.should.be.equal("First Post");
                    loadedPost.text.should.be.equal("About first post");
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=entity-schema-basic.js.map