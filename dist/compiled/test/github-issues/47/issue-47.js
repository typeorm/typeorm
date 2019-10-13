"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var Post_1 = require("./entity/Post");
var chai_1 = require("chai");
var Category_1 = require("./entity/Category");
describe("github issues > #47 wrong sql syntax when loading lazy relation", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                        enabledDrivers: ["mysql"] // we can properly test lazy-relations only on one platform
                    })];
                case 1: return [2 /*return*/, connections = _a.sent()];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should persist successfully and return persisted entity", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var category1, post1, category2, post2, loadedPost, loadedCategory1, loadedCategory2, loadedPosts1, loadedPosts2;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    category1 = new Category_1.Category();
                    category1.name = "category #1";
                    post1 = new Post_1.Post();
                    post1.title = "Hello Post #1";
                    post1.category = Promise.resolve(category1);
                    category2 = new Category_1.Category();
                    category2.name = "category #2";
                    post2 = new Post_1.Post();
                    post2.title = "Hello Post #2";
                    post2.category = Promise.resolve(category2);
                    // persist
                    return [4 /*yield*/, connection.manager.save(category1)];
                case 1:
                    // persist
                    _a.sent();
                    return [4 /*yield*/, connection.manager.save(post1)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, connection.manager.save(category2)];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, connection.manager.save(post2)];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, connection.manager
                            .createQueryBuilder(Post_1.Post, "post")
                            .getMany()];
                case 5:
                    loadedPost = _a.sent();
                    return [4 /*yield*/, loadedPost[0].category];
                case 6:
                    loadedCategory1 = _a.sent();
                    chai_1.expect(loadedCategory1).not.to.be.undefined;
                    loadedCategory1.id.should.equal(1);
                    loadedCategory1.name.should.equal("category #1");
                    return [4 /*yield*/, loadedPost[1].category];
                case 7:
                    loadedCategory2 = _a.sent();
                    chai_1.expect(loadedCategory2).not.to.be.undefined;
                    loadedCategory2.id.should.equal(2);
                    loadedCategory2.name.should.equal("category #2");
                    return [4 /*yield*/, loadedCategory1.posts];
                case 8:
                    loadedPosts1 = _a.sent();
                    chai_1.expect(loadedPosts1).not.to.be.undefined;
                    loadedPosts1[0].id.should.equal(1);
                    loadedPosts1[0].title.should.equal("Hello Post #1");
                    return [4 /*yield*/, loadedCategory2.posts];
                case 9:
                    loadedPosts2 = _a.sent();
                    chai_1.expect(loadedPosts2).not.to.be.undefined;
                    loadedPosts2[0].id.should.equal(2);
                    loadedPosts2[0].title.should.equal("Hello Post #2");
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-47.js.map