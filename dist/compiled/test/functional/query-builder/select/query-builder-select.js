"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../../utils/test-utils");
var Post_1 = require("./entity/Post");
var chai_1 = require("chai");
describe("query builder > select", function () {
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
    it("should append all entity mapped columns from main selection to select statement", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var sql;
        return tslib_1.__generator(this, function (_a) {
            sql = connection.manager.createQueryBuilder(Post_1.Post, "post")
                .disableEscaping()
                .getSql();
            chai_1.expect(sql).to.equal("SELECT post.id AS post_id, " +
                "post.title AS post_title, " +
                "post.description AS post_description, " +
                "post.rating AS post_rating, " +
                "post.version AS post_version, " +
                "post.categoryId AS post_categoryId " +
                "FROM post post");
            return [2 /*return*/];
        });
    }); })); });
    it("should append all entity mapped columns from main selection to SELECT DISTINCT statement", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var sql;
        return tslib_1.__generator(this, function (_a) {
            sql = connection.manager.createQueryBuilder(Post_1.Post, "post")
                .distinct()
                .disableEscaping()
                .getSql();
            chai_1.expect(sql).to.equal("SELECT DISTINCT post.id AS post_id, " +
                "post.title AS post_title, " +
                "post.description AS post_description, " +
                "post.rating AS post_rating, " +
                "post.version AS post_version, " +
                "post.categoryId AS post_categoryId " +
                "FROM post post");
            return [2 /*return*/];
        });
    }); })); });
    it("should append all entity mapped columns from both main selection and join selections to select statement", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var sql;
        return tslib_1.__generator(this, function (_a) {
            sql = connection.createQueryBuilder(Post_1.Post, "post")
                .leftJoinAndSelect("category", "category")
                .disableEscaping()
                .getSql();
            chai_1.expect(sql).to.equal("SELECT post.id AS post_id, " +
                "post.title AS post_title, " +
                "post.description AS post_description, " +
                "post.rating AS post_rating, " +
                "post.version AS post_version, " +
                "post.categoryId AS post_categoryId, " +
                "category.id AS category_id, " +
                "category.name AS category_name," +
                " category.description AS category_description, " +
                "category.version AS category_version " +
                "FROM post post LEFT JOIN category category");
            return [2 /*return*/];
        });
    }); })); });
    it("should append entity mapped columns from both main alias and join aliases to select statement", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var sql;
        return tslib_1.__generator(this, function (_a) {
            sql = connection.createQueryBuilder(Post_1.Post, "post")
                .select("post.id")
                .addSelect("category.name")
                .leftJoin("category", "category")
                .disableEscaping()
                .getSql();
            chai_1.expect(sql).to.equal("SELECT post.id AS post_id, " +
                "category.name AS category_name " +
                "FROM post post LEFT JOIN category category");
            return [2 /*return*/];
        });
    }); })); });
    it("should append entity mapped columns to select statement, if they passed as array", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var sql;
        return tslib_1.__generator(this, function (_a) {
            sql = connection.createQueryBuilder(Post_1.Post, "post")
                .select(["post.id", "post.title"])
                .disableEscaping()
                .getSql();
            chai_1.expect(sql).to.equal("SELECT post.id AS post_id, post.title AS post_title FROM post post");
            return [2 /*return*/];
        });
    }); })); });
    it("should append raw sql to select statement", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var sql;
        return tslib_1.__generator(this, function (_a) {
            sql = connection.createQueryBuilder(Post_1.Post, "post")
                .select("COUNT(*) as cnt")
                .disableEscaping()
                .getSql();
            chai_1.expect(sql).to.equal("SELECT COUNT(*) as cnt FROM post post");
            return [2 /*return*/];
        });
    }); })); });
    it("should append raw sql and entity mapped column to select statement", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var sql;
        return tslib_1.__generator(this, function (_a) {
            sql = connection.createQueryBuilder(Post_1.Post, "post")
                .select(["COUNT(*) as cnt", "post.title"])
                .disableEscaping()
                .getSql();
            chai_1.expect(sql).to.equal("SELECT post.title AS post_title, COUNT(*) as cnt FROM post post");
            return [2 /*return*/];
        });
    }); })); });
    it("should not create alias for selection, which is not entity mapped column", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var sql;
        return tslib_1.__generator(this, function (_a) {
            sql = connection.createQueryBuilder(Post_1.Post, "post")
                .select("post.name")
                .disableEscaping()
                .getSql();
            chai_1.expect(sql).to.equal("SELECT post.name FROM post post");
            return [2 /*return*/];
        });
    }); })); });
});
//# sourceMappingURL=query-builder-select.js.map