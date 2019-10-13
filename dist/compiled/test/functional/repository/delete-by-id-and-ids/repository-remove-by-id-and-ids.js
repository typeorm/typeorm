"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var chai_1 = require("chai");
var Post_1 = require("./entity/Post");
var test_utils_1 = require("../../../utils/test-utils");
describe("repository > deleteById methods", function () {
    // -------------------------------------------------------------------------
    // Configuration
    // -------------------------------------------------------------------------
    var _this = this;
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                    })];
                case 1: return [2 /*return*/, connections = _a.sent()];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    // -------------------------------------------------------------------------
    // Specifications
    // -------------------------------------------------------------------------
    it("remove using deleteById method should delete successfully", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var postRepository, newPost1, newPost2, newPost3, newPost4, loadedPosts;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    postRepository = connection.getRepository(Post_1.Post);
                    newPost1 = postRepository.create();
                    newPost1.title = "Super post #1";
                    newPost2 = postRepository.create();
                    newPost2.title = "Super post #2";
                    newPost3 = postRepository.create();
                    newPost3.title = "Super post #3";
                    newPost4 = postRepository.create();
                    newPost4.title = "Super post #4";
                    return [4 /*yield*/, Promise.all([
                            postRepository.save(newPost1),
                            postRepository.save(newPost2),
                            postRepository.save(newPost3),
                            postRepository.save(newPost4)
                        ])];
                case 1:
                    _a.sent();
                    // remove one
                    return [4 /*yield*/, postRepository.delete(1)];
                case 2:
                    // remove one
                    _a.sent();
                    return [4 /*yield*/, postRepository.find()];
                case 3:
                    loadedPosts = _a.sent();
                    // assert
                    loadedPosts.length.should.be.equal(3);
                    chai_1.expect(loadedPosts.find(function (p) { return p.id === 1; })).to.be.undefined;
                    chai_1.expect(loadedPosts.find(function (p) { return p.id === 2; })).not.to.be.undefined;
                    chai_1.expect(loadedPosts.find(function (p) { return p.id === 3; })).not.to.be.undefined;
                    chai_1.expect(loadedPosts.find(function (p) { return p.id === 4; })).not.to.be.undefined;
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("remove using removeByIds method should delete successfully", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var postRepository, newPost1, newPost2, newPost3, newPost4, loadedPosts;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    postRepository = connection.getRepository(Post_1.Post);
                    newPost1 = postRepository.create();
                    newPost1.title = "Super post #1";
                    newPost2 = postRepository.create();
                    newPost2.title = "Super post #2";
                    newPost3 = postRepository.create();
                    newPost3.title = "Super post #3";
                    newPost4 = postRepository.create();
                    newPost4.title = "Super post #4";
                    return [4 /*yield*/, Promise.all([
                            postRepository.save(newPost1),
                            postRepository.save(newPost2),
                            postRepository.save(newPost3),
                            postRepository.save(newPost4)
                        ])];
                case 1:
                    _a.sent();
                    // remove multiple
                    return [4 /*yield*/, postRepository.delete([2, 3])];
                case 2:
                    // remove multiple
                    _a.sent();
                    return [4 /*yield*/, postRepository.find()];
                case 3:
                    loadedPosts = _a.sent();
                    // assert
                    loadedPosts.length.should.be.equal(2);
                    chai_1.expect(loadedPosts.find(function (p) { return p.id === 1; })).not.to.be.undefined;
                    chai_1.expect(loadedPosts.find(function (p) { return p.id === 2; })).to.be.undefined;
                    chai_1.expect(loadedPosts.find(function (p) { return p.id === 3; })).to.be.undefined;
                    chai_1.expect(loadedPosts.find(function (p) { return p.id === 4; })).not.to.be.undefined;
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=repository-remove-by-id-and-ids.js.map