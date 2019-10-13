"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var Post_1 = require("./entity/Post");
var chai_1 = require("chai");
describe("other issues > joining empty relations", function () {
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
    it("should return empty array if its joined and nothing was found", function () { return Promise.all(connections.map(function (connection) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var post, loadedPosts1;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        post = new Post_1.Post();
                        post.title = "Hello Post";
                        return [4 /*yield*/, connection.manager.save(post)];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, connection.manager
                                .createQueryBuilder(Post_1.Post, "post")
                                .leftJoinAndSelect("post.categories", "categories")
                                .getMany()];
                    case 2:
                        loadedPosts1 = _a.sent();
                        chai_1.expect(loadedPosts1).not.to.be.undefined;
                        loadedPosts1.should.be.eql([{
                                id: 1,
                                title: "Hello Post",
                                categories: []
                            }]);
                        return [2 /*return*/];
                }
            });
        });
    })); });
    it("should return empty array if its joined and nothing was found, but relations in empty results should be skipped", function () { return Promise.all(connections.map(function (connection) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var post, loadedPosts1;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        post = new Post_1.Post();
                        post.title = "Hello Post";
                        return [4 /*yield*/, connection.manager.save(post)];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, connection.manager
                                .createQueryBuilder(Post_1.Post, "post")
                                .leftJoinAndSelect("post.categories", "categories")
                                .leftJoinAndSelect("categories.authors", "authors")
                                .getMany()];
                    case 2:
                        loadedPosts1 = _a.sent();
                        chai_1.expect(loadedPosts1).not.to.be.undefined;
                        loadedPosts1.should.be.eql([{
                                id: 1,
                                title: "Hello Post",
                                categories: []
                            }]);
                        return [2 /*return*/];
                }
            });
        });
    })); });
});
//# sourceMappingURL=join-empty-relations.js.map