"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var Post_1 = require("./entity/Post");
var Author_1 = require("./entity/Author");
var Abbreviation_1 = require("./entity/Abbreviation");
describe("github issues > #215 invalid replacements of join conditions", function () {
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
    it("should not do invalid replacements of join conditions", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var author, abbrev, post, loadedPosts;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    author = new Author_1.Author();
                    author.name = "John Doe";
                    return [4 /*yield*/, connection.manager.save(author)];
                case 1:
                    _a.sent();
                    abbrev = new Abbreviation_1.Abbreviation();
                    abbrev.name = "test";
                    return [4 /*yield*/, connection.manager.save(abbrev)];
                case 2:
                    _a.sent();
                    post = new Post_1.Post();
                    post.author = author;
                    post.abbreviation = abbrev;
                    return [4 /*yield*/, connection.manager.save(post)];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, connection.manager
                            .createQueryBuilder(Post_1.Post, "p")
                            .leftJoinAndMapOne("p.author", Author_1.Author, "n", "p.author_id = n.id")
                            .leftJoinAndMapOne("p.abbreviation", Abbreviation_1.Abbreviation, "ab", "p.abbreviation_id = ab.id")
                            .getMany()];
                case 4:
                    loadedPosts = _a.sent();
                    loadedPosts.length.should.be.equal(1);
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-215.js.map