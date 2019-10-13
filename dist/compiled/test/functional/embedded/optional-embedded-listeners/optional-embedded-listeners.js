"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../../utils/test-utils");
var Post_1 = require("./entity/Post");
var chai_1 = require("chai");
var PostInformation_1 = require("./entity/PostInformation");
var PostCounter_1 = require("./entity/PostCounter");
describe("other issues > entity listeners must work in optional embeddeds as well", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                        enabledDrivers: ["postgres"]
                    })];
                case 1: return [2 /*return*/, connections = _a.sent()];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("getters and setters should work correctly", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var post1, post2, post3, loadedPosts;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    post1 = new Post_1.Post();
                    post1.title = "First title";
                    post1.text = "About this post";
                    return [4 /*yield*/, connection.manager.save(post1)];
                case 1:
                    _a.sent();
                    post2 = new Post_1.Post();
                    post2.title = "Second title";
                    post2.text = "About this post";
                    post2.information = new PostInformation_1.PostInformation();
                    return [4 /*yield*/, connection.manager.save(post2)];
                case 2:
                    _a.sent();
                    post3 = new Post_1.Post();
                    post3.title = "Third title";
                    post3.text = "About this post";
                    post3.information = new PostInformation_1.PostInformation();
                    post3.information.counters = new PostCounter_1.PostCounter();
                    return [4 /*yield*/, connection.manager.save(post3)];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, connection
                            .manager
                            .createQueryBuilder(Post_1.Post, "post")
                            .orderBy("post.id")
                            .getMany()];
                case 4:
                    loadedPosts = _a.sent();
                    chai_1.expect(loadedPosts[0]).not.to.be.undefined;
                    chai_1.expect(loadedPosts[0].title).not.to.be.undefined;
                    chai_1.expect(loadedPosts[0].text).not.to.be.undefined;
                    loadedPosts[0].title.should.be.equal("First title");
                    loadedPosts[0].text.should.be.equal("About this post");
                    chai_1.expect(loadedPosts[1]).not.to.be.undefined;
                    loadedPosts[1].title.should.be.equal("Second title");
                    loadedPosts[1].information.description.should.be.equal("default post description");
                    chai_1.expect(loadedPosts[2]).not.to.be.undefined;
                    loadedPosts[2].title.should.be.equal("Third title");
                    loadedPosts[2].information.counters.likes.should.be.equal(0);
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=optional-embedded-listeners.js.map