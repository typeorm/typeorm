"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../../utils/test-utils");
var chai_1 = require("chai");
var Post_1 = require("./entity/Post");
var PostgresDriver_1 = require("../../../../src/driver/postgres/PostgresDriver");
var MysqlDriver_1 = require("../../../../src/driver/mysql/MysqlDriver");
describe("query builder > order-by", function () {
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
    it("should be always in right order(default order)", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var post1, post2, loadedPost;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    post1 = new Post_1.Post();
                    post1.myOrder = 1;
                    post2 = new Post_1.Post();
                    post2.myOrder = 2;
                    return [4 /*yield*/, connection.manager.save([post1, post2])];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, connection.manager
                            .createQueryBuilder(Post_1.Post, "post")
                            .getOne()];
                case 2:
                    loadedPost = _a.sent();
                    chai_1.expect(loadedPost.myOrder).to.be.equal(2);
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should be always in right order(custom order)", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var post1, post2, loadedPost;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    post1 = new Post_1.Post();
                    post1.myOrder = 1;
                    post2 = new Post_1.Post();
                    post2.myOrder = 2;
                    return [4 /*yield*/, connection.manager.save([post1, post2])];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, connection.manager
                            .createQueryBuilder(Post_1.Post, "post")
                            .addOrderBy("post.myOrder", "ASC")
                            .getOne()];
                case 2:
                    loadedPost = _a.sent();
                    chai_1.expect(loadedPost.myOrder).to.be.equal(1);
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should be always in right order(custom order)", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var post1, post2, loadedPost1, loadedPost2;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!(connection.driver instanceof PostgresDriver_1.PostgresDriver)) // NULLS FIRST / LAST only supported by postgres
                        return [2 /*return*/];
                    post1 = new Post_1.Post();
                    post1.myOrder = 1;
                    post2 = new Post_1.Post();
                    post2.myOrder = 2;
                    return [4 /*yield*/, connection.manager.save([post1, post2])];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, connection.manager
                            .createQueryBuilder(Post_1.Post, "post")
                            .addOrderBy("post.myOrder", "ASC", "NULLS FIRST")
                            .getOne()];
                case 2:
                    loadedPost1 = _a.sent();
                    chai_1.expect(loadedPost1.myOrder).to.be.equal(1);
                    return [4 /*yield*/, connection.manager
                            .createQueryBuilder(Post_1.Post, "post")
                            .addOrderBy("post.myOrder", "ASC", "NULLS LAST")
                            .getOne()];
                case 3:
                    loadedPost2 = _a.sent();
                    chai_1.expect(loadedPost2.myOrder).to.be.equal(1);
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should be always in right order(custom order)", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var post1, post2, loadedPost1, loadedPost2;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!(connection.driver instanceof MysqlDriver_1.MysqlDriver)) // IS NULL / IS NOT NULL only supported by mysql
                        return [2 /*return*/];
                    post1 = new Post_1.Post();
                    post1.myOrder = 1;
                    post2 = new Post_1.Post();
                    post2.myOrder = 2;
                    return [4 /*yield*/, connection.manager.save([post1, post2])];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, connection.manager
                            .createQueryBuilder(Post_1.Post, "post")
                            .addOrderBy("post.myOrder IS NULL", "ASC")
                            .getOne()];
                case 2:
                    loadedPost1 = _a.sent();
                    chai_1.expect(loadedPost1.myOrder).to.be.equal(1);
                    return [4 /*yield*/, connection.manager
                            .createQueryBuilder(Post_1.Post, "post")
                            .addOrderBy("post.myOrder IS NOT NULL", "ASC")
                            .getOne()];
                case 3:
                    loadedPost2 = _a.sent();
                    chai_1.expect(loadedPost2.myOrder).to.be.equal(1);
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should be able to order by sql statement", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var post1, post2, loadedPost1, loadedPost2;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!(connection.driver instanceof MysqlDriver_1.MysqlDriver))
                        return [2 /*return*/]; // DIV statement does not supported by all drivers
                    post1 = new Post_1.Post();
                    post1.myOrder = 1;
                    post1.num1 = 10;
                    post1.num2 = 5;
                    post2 = new Post_1.Post();
                    post2.myOrder = 2;
                    post2.num1 = 10;
                    post2.num2 = 2;
                    return [4 /*yield*/, connection.manager.save([post1, post2])];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, connection.manager
                            .createQueryBuilder(Post_1.Post, "post")
                            .orderBy("post.num1 DIV post.num2")
                            .getOne()];
                case 2:
                    loadedPost1 = _a.sent();
                    chai_1.expect(loadedPost1.num1).to.be.equal(10);
                    chai_1.expect(loadedPost1.num2).to.be.equal(5);
                    return [4 /*yield*/, connection.manager
                            .createQueryBuilder(Post_1.Post, "post")
                            .orderBy("post.num1 DIV post.num2", "DESC")
                            .getOne()];
                case 3:
                    loadedPost2 = _a.sent();
                    chai_1.expect(loadedPost2.num1).to.be.equal(10);
                    chai_1.expect(loadedPost2.num2).to.be.equal(2);
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=query-builder-order-by.js.map