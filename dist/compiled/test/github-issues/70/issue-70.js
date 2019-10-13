"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var Post_1 = require("./entity/Post");
var chai_1 = require("chai");
var Category_1 = require("./entity/Category");
describe("github issues > #70 cascade deleting works incorrect", function () {
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
        var category1, category2, post, loadedPost, loadedCategories, loadedPosts2, loadedCategories2;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    category1 = new Category_1.Category();
                    category1.name = "category #1";
                    category2 = new Category_1.Category();
                    category2.name = "category #2";
                    post = new Post_1.Post();
                    post.title = "Hello Post #1";
                    post.categories = [category1, category2];
                    // persist post (other are persisted by cascades)
                    return [4 /*yield*/, connection.manager.save(post)];
                case 1:
                    // persist post (other are persisted by cascades)
                    _a.sent();
                    return [4 /*yield*/, connection.manager
                            .createQueryBuilder(Post_1.Post, "post")
                            .innerJoinAndSelect("post.categories", "category")
                            .orderBy("post.id, category.id")
                            .getOne()];
                case 2:
                    loadedPost = _a.sent();
                    return [4 /*yield*/, connection.manager
                            .createQueryBuilder(Category_1.Category, "category")
                            .orderBy("category.id")
                            .getMany()];
                case 3:
                    loadedCategories = _a.sent();
                    chai_1.expect(loadedPost).not.to.be.undefined;
                    loadedPost.should.deep.include({
                        id: 1,
                        title: "Hello Post #1"
                    });
                    loadedPost.categories.length.should.be.equal(2);
                    chai_1.expect(loadedCategories).not.to.be.undefined;
                    loadedCategories[0].id.should.be.equal(1);
                    loadedCategories[1].id.should.be.equal(2);
                    // now remove post. categories should be removed too
                    return [4 /*yield*/, connection.manager.remove(post)];
                case 4:
                    // now remove post. categories should be removed too
                    _a.sent();
                    return [4 /*yield*/, connection.manager
                            .createQueryBuilder(Post_1.Post, "post")
                            .getMany()];
                case 5:
                    loadedPosts2 = _a.sent();
                    return [4 /*yield*/, connection.manager
                            .createQueryBuilder(Category_1.Category, "category")
                            .getMany()];
                case 6:
                    loadedCategories2 = _a.sent();
                    chai_1.expect(loadedPosts2).to.be.eql([]);
                    chai_1.expect(loadedCategories2).to.be.eql([]);
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-70.js.map