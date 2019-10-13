"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var Post_1 = require("./entity/Post");
var MysqlDriver_1 = require("../../../src/driver/mysql/MysqlDriver");
var Category_1 = require("./entity/Category");
describe("github issues > #813 order by must support functions", function () {
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
    it("should work perfectly", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var categories, post, posts;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!(connection.driver instanceof MysqlDriver_1.MysqlDriver))
                        return [2 /*return*/];
                    categories = [new Category_1.Category(), new Category_1.Category()];
                    return [4 /*yield*/, connection.manager.save(categories)];
                case 1:
                    _a.sent();
                    post = new Post_1.Post();
                    post.title = "About order by";
                    post.categories = categories;
                    return [4 /*yield*/, connection.manager.save(post)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, connection.createQueryBuilder(Post_1.Post, "post")
                            .leftJoinAndSelect("post.categories", "categories")
                            .orderBy("RAND()")
                            .getMany()];
                case 3:
                    posts = _a.sent();
                    posts[0].id.should.be.equal(1);
                    posts[0].title.should.be.equal("About order by");
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should work perfectly with pagination as well", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var categories, post, posts;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!(connection.driver instanceof MysqlDriver_1.MysqlDriver))
                        return [2 /*return*/];
                    categories = [new Category_1.Category(), new Category_1.Category()];
                    return [4 /*yield*/, connection.manager.save(categories)];
                case 1:
                    _a.sent();
                    post = new Post_1.Post();
                    post.title = "About order by";
                    post.categories = categories;
                    return [4 /*yield*/, connection.manager.save(post)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, connection.createQueryBuilder(Post_1.Post, "post")
                            .leftJoinAndSelect("post.categories", "categories")
                            .orderBy("RAND()")
                            .skip(0)
                            .take(1)
                            .getMany()];
                case 3:
                    posts = _a.sent();
                    posts[0].id.should.be.equal(1);
                    posts[0].title.should.be.equal("About order by");
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-813.js.map