"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var test_utils_1 = require("../../utils/test-utils");
var src_1 = require("../../../src");
var Author_1 = require("./entity/Author");
var Post_1 = require("./entity/Post");
describe("github issues > #1308 Raw Postgresql Update query result is always an empty array", function () {
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
            var author;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        author = new Author_1.Author();
                        author.id = 1;
                        author.name = "Jane Doe";
                        return [4 /*yield*/, connection.manager.save(author)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    }
    it("Update query returns the number of affected rows", function () {
        return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var result1, result2;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, prepareData(connection)];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, connection.createQueryBuilder()
                                .update(Author_1.Author)
                                .set({ name: "John Doe" })
                                .where("name = :name", { name: "Jonas Doe" })
                                .execute()];
                    case 2:
                        result1 = _a.sent();
                        result1.affected.should.be.eql(0);
                        return [4 /*yield*/, connection.createQueryBuilder()
                                .update(Author_1.Author)
                                .set({ name: "John Doe" })
                                .where("name = :name", { name: "Jane Doe" })
                                .execute()];
                    case 3:
                        result2 = _a.sent();
                        result2.affected.should.be.eql(1);
                        return [2 /*return*/];
                }
            });
        }); }));
    });
});
//# sourceMappingURL=issue-1308.js.map