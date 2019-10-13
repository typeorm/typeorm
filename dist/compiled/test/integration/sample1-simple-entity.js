"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var chai_1 = require("chai");
var Post_1 = require("../../sample/sample1-simple-entity/entity/Post");
var test_utils_1 = require("../utils/test-utils");
describe("insertion", function () {
    // -------------------------------------------------------------------------
    // Setup
    // -------------------------------------------------------------------------
    var _this = this;
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
    // -------------------------------------------------------------------------
    // Specifications: persist
    // -------------------------------------------------------------------------
    it("basic insert functionality", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var postRepository, newPost, savedPost, insertedPost;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    postRepository = connection.getRepository(Post_1.Post);
                    newPost = new Post_1.Post();
                    newPost.text = "Hello post";
                    newPost.title = "this is post title";
                    newPost.likesCount = 0;
                    return [4 /*yield*/, postRepository.save(newPost)];
                case 1:
                    savedPost = _a.sent();
                    savedPost.should.be.equal(newPost);
                    chai_1.expect(savedPost.id).not.to.be.undefined;
                    return [4 /*yield*/, postRepository.findOne(savedPost.id)];
                case 2:
                    insertedPost = _a.sent();
                    insertedPost.should.be.eql({
                        id: savedPost.id,
                        text: "Hello post",
                        title: "this is post title",
                        likesCount: 0
                    });
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=sample1-simple-entity.js.map