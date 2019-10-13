"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var Post_1 = require("./entity/Post");
var Category_1 = require("./entity/Category");
var chai_1 = require("chai");
describe("github issues > Join query on ManyToMany relations not working", function () {
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
    it("embedded with custom column name should persist and load without errors", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var i, category, post, loadedPost;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    i = 0;
                    _a.label = 1;
                case 1:
                    if (!(i < 20)) return [3 /*break*/, 4];
                    category = new Category_1.Category();
                    category.name = "Category #" + i;
                    return [4 /*yield*/, connection.manager.save(category)];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3:
                    i++;
                    return [3 /*break*/, 1];
                case 4:
                    post = new Post_1.Post();
                    post.title = "SuperRace";
                    post.categories = [new Category_1.Category()];
                    post.categories[0].name = "SuperCategory";
                    return [4 /*yield*/, connection.manager.save(post)];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, connection
                            .manager
                            .createQueryBuilder(Post_1.Post, "post")
                            .leftJoinAndSelect("post.categories", "category")
                            .where("category.category_id IN (:...ids)", { ids: [21] })
                            .getOne()];
                case 6:
                    loadedPost = _a.sent();
                    chai_1.expect(loadedPost).not.to.be.undefined;
                    chai_1.expect(loadedPost.categories).not.to.be.undefined;
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-345.js.map