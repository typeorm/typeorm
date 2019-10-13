"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var test_utils_1 = require("../../utils/test-utils");
var src_1 = require("../../../src");
var Author_1 = require("./entity/Author");
var Post_1 = require("./entity/Post");
describe("github issues > #4156 QueryExpressionMap doesn't clone all values correctly", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [new src_1.EntitySchema(Author_1.AuthorSchema), new src_1.EntitySchema(Post_1.PostSchema)],
                        dropSchema: true,
                        enabledDrivers: ["postgres"],
                    })];
                case 1: return [2 /*return*/, (connections = _a.sent())];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    function prepareData(connection) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var author, post;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        author = new Author_1.Author();
                        author.id = 1;
                        author.name = "Jane Doe";
                        return [4 /*yield*/, connection.manager.save(author)];
                    case 1:
                        _a.sent();
                        post = new Post_1.Post();
                        post.id = 1;
                        post.title = "Post 1";
                        post.author = author;
                        return [4 /*yield*/, connection.manager.save(post)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    }
    it("should not error when the query builder has been cloned", function () {
        return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var qb, _a, loadedPost1, loadedPost2;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, prepareData(connection)];
                    case 1:
                        _b.sent();
                        qb = connection.manager
                            .createQueryBuilder("Post", "post");
                        return [4 /*yield*/, Promise.all([
                                qb.clone().where({ id: 1 }).getOne(),
                                qb.clone().where({ id: src_1.In([1]) }).getOne(),
                            ])];
                    case 2:
                        _a = tslib_1.__read.apply(void 0, [_b.sent(), 2]), loadedPost1 = _a[0], loadedPost2 = _a[1];
                        loadedPost1.should.be.eql({
                            id: 1,
                            title: "Post 1"
                        });
                        loadedPost2.should.be.eql({
                            id: 1,
                            title: "Post 1"
                        });
                        return [2 /*return*/];
                }
            });
        }); }));
    });
    it("should not error when the query builder with where statement has been cloned", function () {
        return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var qb, _a, loadedPost1, loadedPost2;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, prepareData(connection)];
                    case 1:
                        _b.sent();
                        qb = connection.manager
                            .createQueryBuilder("Post", "post")
                            .where({ id: 1 });
                        return [4 /*yield*/, Promise.all([
                                qb.clone().getOne(),
                                qb.clone().getOne(),
                            ])];
                    case 2:
                        _a = tslib_1.__read.apply(void 0, [_b.sent(), 2]), loadedPost1 = _a[0], loadedPost2 = _a[1];
                        loadedPost1.should.be.eql({
                            id: 1,
                            title: "Post 1"
                        });
                        loadedPost2.should.be.eql({
                            id: 1,
                            title: "Post 1"
                        });
                        return [2 /*return*/];
                }
            });
        }); }));
    });
});
//# sourceMappingURL=issue-4156.js.map