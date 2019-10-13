"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var chai_1 = require("chai");
var Post_1 = require("./entity/Post");
var Category_1 = require("./entity/Category");
describe("github issues > #151 joinAndSelect can't find entity from inverse side of relation", function () {
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
    it("should cascade persist successfully", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var category, post, loadedPost;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    category = new Category_1.Category();
                    category.name = "post category";
                    post = new Post_1.Post();
                    post.title = "Hello post";
                    post.category = category;
                    return [4 /*yield*/, connection.manager.save(post)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, connection.manager.findOne(Post_1.Post, 1, {
                            join: {
                                alias: "post",
                                innerJoinAndSelect: {
                                    category: "post.category"
                                }
                            }
                        })];
                case 2:
                    loadedPost = _a.sent();
                    chai_1.expect(loadedPost).not.to.be.undefined;
                    loadedPost.should.be.eql({
                        id: 1,
                        title: "Hello post",
                        category: {
                            id: 1,
                            name: "post category"
                        }
                    });
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-151.js.map