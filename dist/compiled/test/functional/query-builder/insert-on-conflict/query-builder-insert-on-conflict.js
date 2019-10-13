"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../../utils/test-utils");
var Post_1 = require("./entity/Post");
describe("query builder > insertion > on conflict", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                        enabledDrivers: ["postgres", "sqlite"] // since on conflict statement is only supported in postgres and sqlite >= 3.24.0
                    })];
                case 1: return [2 /*return*/, connections = _a.sent()];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should perform insertion correctly", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var post1, post2;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    post1 = new Post_1.Post();
                    post1.id = "post#1";
                    post1.title = "About post";
                    return [4 /*yield*/, connection.createQueryBuilder()
                            .insert()
                            .into(Post_1.Post)
                            .values(post1)
                            .execute()];
                case 1:
                    _a.sent();
                    post2 = new Post_1.Post();
                    post2.id = "post#1";
                    post2.title = "Again post";
                    return [4 /*yield*/, connection.createQueryBuilder()
                            .insert()
                            .into(Post_1.Post)
                            .values(post2)
                            .onConflict("(\"id\") DO NOTHING")
                            .execute()];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, connection.manager.findOne(Post_1.Post, "post#1").should.eventually.be.eql({
                            id: "post#1",
                            title: "About post"
                        })];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, connection.createQueryBuilder()
                            .insert()
                            .into(Post_1.Post)
                            .values(post2)
                            .onConflict("(\"id\") DO UPDATE SET \"title\" = :title")
                            .setParameter("title", post2.title)
                            .execute()];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, connection.manager.findOne(Post_1.Post, "post#1").should.eventually.be.eql({
                            id: "post#1",
                            title: "Again post"
                        })];
                case 5:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=query-builder-insert-on-conflict.js.map