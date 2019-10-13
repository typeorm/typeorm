"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var chai_1 = require("chai");
var test_utils_1 = require("../../../utils/test-utils");
var Post_1 = require("./entity/Post");
describe("columns > no-selection functionality", function () {
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
    it("should not select columns marked with select: false option", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
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
                    return [4 /*yield*/, postRepository.findOne(post.id)];
                case 2:
                    loadedPost = _a.sent();
                    chai_1.expect(loadedPost.title).to.be.equal("About columns");
                    chai_1.expect(loadedPost.text).to.be.equal("Some text about columns");
                    chai_1.expect(loadedPost.authorName).to.be.undefined;
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should not select columns with QueryBuilder marked with select: false option", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
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
                    return [4 /*yield*/, postRepository
                            .createQueryBuilder("post")
                            .where("post.id = :id", { id: post.id })
                            .getOne()];
                case 2:
                    loadedPost = _a.sent();
                    chai_1.expect(loadedPost.title).to.be.equal("About columns");
                    chai_1.expect(loadedPost.text).to.be.equal("Some text about columns");
                    chai_1.expect(loadedPost.authorName).to.be.undefined;
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should select columns with select: false even columns were implicitly selected", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
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
                    return [4 /*yield*/, postRepository
                            .createQueryBuilder("post")
                            .addSelect("post.authorName")
                            .where("post.id = :id", { id: post.id })
                            .getOne()];
                case 2:
                    loadedPost = _a.sent();
                    chai_1.expect(loadedPost.title).to.be.equal("About columns");
                    chai_1.expect(loadedPost.text).to.be.equal("Some text about columns");
                    chai_1.expect(loadedPost.authorName).to.be.equal("Umed");
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=columns-no-select.js.map