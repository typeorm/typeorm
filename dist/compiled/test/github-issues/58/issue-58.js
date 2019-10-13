"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var Post_1 = require("./entity/Post");
var Category_1 = require("./entity/Category");
var PostCategory_1 = require("./entity/PostCategory");
var chai_1 = require("chai");
describe("github issues > #58 relations with multiple primary keys", function () {
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
    it("should persist successfully and return persisted entity", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var category1, category2, post, postCategory1, postCategory2, loadedPost;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    category1 = new Category_1.Category();
                    category1.name = "category #1";
                    category2 = new Category_1.Category();
                    category2.name = "category #2";
                    post = new Post_1.Post();
                    post.title = "Hello Post #1";
                    postCategory1 = new PostCategory_1.PostCategory();
                    postCategory1.addedByAdmin = true;
                    postCategory1.addedByUser = false;
                    postCategory1.category = category1;
                    postCategory1.post = post;
                    postCategory2 = new PostCategory_1.PostCategory();
                    postCategory2.addedByAdmin = false;
                    postCategory2.addedByUser = true;
                    postCategory2.category = category2;
                    postCategory2.post = post;
                    return [4 /*yield*/, connection.manager.save(postCategory1)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, connection.manager.save(postCategory2)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, connection.manager
                            .createQueryBuilder(Post_1.Post, "post")
                            .innerJoinAndSelect("post.categories", "postCategory")
                            .innerJoinAndSelect("postCategory.category", "category")
                            .getOne()];
                case 3:
                    loadedPost = _a.sent();
                    chai_1.expect(loadedPost).not.to.be.undefined;
                    loadedPost.should.be.eql({
                        id: 1,
                        title: "Hello Post #1",
                        categories: [{
                                addedByAdmin: true,
                                addedByUser: false,
                                category: {
                                    id: 1,
                                    name: "category #1"
                                }
                            }, {
                                addedByAdmin: false,
                                addedByUser: true,
                                category: {
                                    id: 2,
                                    name: "category #2"
                                }
                            }]
                    });
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-58.js.map