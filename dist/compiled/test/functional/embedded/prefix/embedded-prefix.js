"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var Post_1 = require("./entity/Post");
var Counters_1 = require("./entity/Counters");
var test_utils_1 = require("../../../utils/test-utils");
describe("embedded > prefix functionality", function () {
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
    it("should insert, load, update and remove entities with embeddeds properly", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var postRepository, post, loadedPost;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    postRepository = connection.getRepository(Post_1.Post);
                    post = new Post_1.Post();
                    post.id = 1;
                    post.title = "Hello post";
                    post.text = "This is text about the post";
                    post.counters = new Counters_1.Counters();
                    post.counters.comments = 5;
                    post.counters.favorites = 2;
                    post.counters.likes = 1;
                    return [4 /*yield*/, postRepository.save(post)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, postRepository.findOne(1)];
                case 2:
                    loadedPost = (_a.sent());
                    loadedPost.id.should.be.equal(1);
                    loadedPost.title.should.be.equal("Hello post");
                    loadedPost.text.should.be.equal("This is text about the post");
                    loadedPost.counters.should.be.eql({
                        comments: 5,
                        favorites: 2,
                        likes: 1
                    });
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=embedded-prefix.js.map