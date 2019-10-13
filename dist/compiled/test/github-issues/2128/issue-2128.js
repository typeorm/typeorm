"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var chai_1 = require("chai");
var Post_1 = require("./entity/Post");
var PostgresDriver_1 = require("../../../src/driver/postgres/PostgresDriver");
describe("github issues > #2128 skip preparePersistentValue for value functions", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                        enabledDrivers: ["postgres", "mysql"],
                    })];
                case 1: return [2 /*return*/, connections = _a.sent()];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should be able to resolve value functions", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var metaAddition, loadedPost;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, connection.createQueryBuilder()
                        .insert()
                        .into(Post_1.Post)
                        .values({
                        title: "First Post",
                        meta: {
                            keywords: [
                                "important",
                                "fresh"
                            ]
                        }
                    })
                        .execute()];
                case 1:
                    _a.sent();
                    metaAddition = JSON.stringify({
                        author: "John Doe"
                    });
                    return [4 /*yield*/, connection.createQueryBuilder()
                            .update(Post_1.Post)
                            .set({
                            meta: function () { return connection.driver instanceof PostgresDriver_1.PostgresDriver
                                ? "'" + metaAddition + "'::JSONB || meta::JSONB"
                                : "JSON_MERGE('" + metaAddition + "', meta)"; }
                        })
                            .where("title = :title", {
                            title: "First Post"
                        })
                            .execute()];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, connection.getRepository(Post_1.Post).findOne({ title: "First Post" })];
                case 3:
                    loadedPost = _a.sent();
                    chai_1.expect(loadedPost.meta).to.deep.equal({
                        author: "John Doe",
                        keywords: [
                            "important",
                            "fresh"
                        ]
                    });
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-2128.js.map