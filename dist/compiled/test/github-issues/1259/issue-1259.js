"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var Post_1 = require("./entity/Post");
var Category_1 = require("./entity/Category");
describe("github issues > #1259 Can't sort by fields added with addSelect", function () {
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
    it("should order by added selects when pagination is used", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var categories, posts, i, post, loadedPosts;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    categories = [new Category_1.Category(), new Category_1.Category()];
                    return [4 /*yield*/, connection.manager.save(categories)];
                case 1:
                    _a.sent();
                    posts = [];
                    for (i = 0; i < 10; i++) {
                        post = new Post_1.Post();
                        if (i > 5 && i < 8) {
                            post.name = "timber";
                        }
                        else {
                            post.name = "Tim" + i + "ber";
                        }
                        post.count = 2;
                        post.categories = categories;
                        posts.push(post);
                    }
                    return [4 /*yield*/, connection.manager.save(posts)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, connection.manager
                            .createQueryBuilder(Post_1.Post, "post")
                            .addSelect("ts_rank_cd(to_tsvector(post.name), to_tsquery(:query))", "rank")
                            .leftJoinAndSelect("post.categories", "categories")
                            .orderBy("rank", "DESC")
                            // .addOrderBy("post.id")
                            .take(5)
                            .setParameter("query", "timber")
                            .getMany()];
                case 3:
                    loadedPosts = _a.sent();
                    loadedPosts.length.should.be.equal(5);
                    loadedPosts[0].id.should.be.equal(7);
                    loadedPosts[0].name.should.be.equal("timber");
                    loadedPosts[1].id.should.be.equal(8);
                    loadedPosts[1].name.should.be.equal("timber");
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should order by added selects when pagination is used", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var categories, posts, i, post, loadedPosts;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    categories = [new Category_1.Category(), new Category_1.Category()];
                    return [4 /*yield*/, connection.manager.save(categories)];
                case 1:
                    _a.sent();
                    posts = [];
                    for (i = 0; i < 10; i++) {
                        post = new Post_1.Post();
                        post.name = "timber";
                        post.count = i * -1;
                        post.categories = categories;
                        posts.push(post);
                    }
                    return [4 /*yield*/, connection.manager.save(posts)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, connection.manager
                            .createQueryBuilder(Post_1.Post, "post")
                            .addSelect("post.count * 2", "doublecount")
                            .leftJoinAndSelect("post.categories", "categories")
                            .orderBy("doublecount")
                            .take(5)
                            .getMany()];
                case 3:
                    loadedPosts = _a.sent();
                    loadedPosts.length.should.be.equal(5);
                    loadedPosts[0].id.should.be.equal(10);
                    loadedPosts[1].id.should.be.equal(9);
                    loadedPosts[2].id.should.be.equal(8);
                    loadedPosts[3].id.should.be.equal(7);
                    loadedPosts[4].id.should.be.equal(6);
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-1259.js.map