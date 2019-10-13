"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var test_utils_1 = require("../../utils/test-utils");
var src_1 = require("../../../src");
var Author_1 = require("./entity/Author");
var Post_1 = require("./entity/Post");
describe("github issues > #1123 load relation eagerly by setting isEager property", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [new src_1.EntitySchema(Author_1.AuthorSchema), new src_1.EntitySchema(Post_1.PostSchema)],
                        dropSchema: true
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
    it("should load all eager relations when object is loaded", function () {
        return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var loadedPost;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, prepareData(connection)];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, connection.manager.findOne(Post_1.Post, 1)];
                    case 2:
                        loadedPost = _a.sent();
                        loadedPost.should.be.eql({
                            id: 1,
                            title: "Post 1",
                            author: {
                                id: 1,
                                name: "Jane Doe"
                            }
                        });
                        return [2 /*return*/];
                }
            });
        }); }));
    });
    it("should not load eager relations when query builder is used", function () {
        return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var loadedPost;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, prepareData(connection)];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, connection.manager
                                .createQueryBuilder("Post", "post")
                                .where("post.id = :id", { id: 1 })
                                .getOne()];
                    case 2:
                        loadedPost = _a.sent();
                        loadedPost.should.be.eql({
                            id: 1,
                            title: "Post 1"
                        });
                        return [2 /*return*/];
                }
            });
        }); }));
    });
});
//# sourceMappingURL=issue-1123.js.map