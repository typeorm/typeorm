"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var Post_1 = require("./entity/Post");
var test_utils_1 = require("../../utils/test-utils");
describe("github issues > #970 Mongo Bad Sort Specification", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [Post_1.Post],
                        enabledDrivers: ["mongodb"]
                    })];
                case 1: return [2 /*return*/, connections = _a.sent()];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should order properly without errors", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var postRepository, firstPost, secondPost, loadedPosts1, loadedPosts2, loadedPosts3, loadedPosts4;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    postRepository = connection.getMongoRepository(Post_1.Post);
                    firstPost = new Post_1.Post();
                    firstPost.title = "Post";
                    firstPost.text = "Everything about post #1";
                    return [4 /*yield*/, postRepository.save(firstPost)];
                case 1:
                    _a.sent();
                    secondPost = new Post_1.Post();
                    secondPost.title = "Post";
                    secondPost.text = "Everything about post #2";
                    return [4 /*yield*/, postRepository.save(secondPost)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, postRepository.find({ where: { title: "Post" }, order: { text: 1 } })];
                case 3:
                    loadedPosts1 = _a.sent();
                    loadedPosts1[0].should.be.instanceOf(Post_1.Post);
                    loadedPosts1[0].id.should.be.eql(firstPost.id);
                    loadedPosts1[0].title.should.be.equal("Post");
                    loadedPosts1[0].text.should.be.equal("Everything about post #1");
                    return [4 /*yield*/, postRepository.find({ where: { title: "Post" }, order: { text: "ASC" } })];
                case 4:
                    loadedPosts2 = _a.sent();
                    loadedPosts2[0].should.be.instanceOf(Post_1.Post);
                    loadedPosts2[0].id.should.be.eql(firstPost.id);
                    loadedPosts2[0].title.should.be.equal("Post");
                    loadedPosts2[0].text.should.be.equal("Everything about post #1");
                    return [4 /*yield*/, postRepository.find({ where: { title: "Post" }, order: { text: -1 } })];
                case 5:
                    loadedPosts3 = _a.sent();
                    loadedPosts3[0].should.be.instanceOf(Post_1.Post);
                    loadedPosts3[0].id.should.be.eql(secondPost.id);
                    loadedPosts3[0].title.should.be.equal("Post");
                    loadedPosts3[0].text.should.be.equal("Everything about post #2");
                    return [4 /*yield*/, postRepository.find({ where: { title: "Post" }, order: { text: "DESC" } })];
                case 6:
                    loadedPosts4 = _a.sent();
                    loadedPosts4[0].should.be.instanceOf(Post_1.Post);
                    loadedPosts4[0].id.should.be.eql(secondPost.id);
                    loadedPosts4[0].title.should.be.equal("Post");
                    loadedPosts4[0].text.should.be.equal("Everything about post #2");
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-970.js.map