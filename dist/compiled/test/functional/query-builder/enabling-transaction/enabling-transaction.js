"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../../utils/test-utils");
var Post_1 = require("./entity/Post");
describe("query builder > enabling transaction", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () { return tslib_1.__generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({ __dirname: __dirname })];
            case 1: return [2 /*return*/, connections = _a.sent()];
        }
    }); }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should execute query in a transaction", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var post;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    post = new Post_1.Post();
                    post.title = "about transactions in query builder";
                    return [4 /*yield*/, connection.createQueryBuilder()
                            .insert()
                            .into(Post_1.Post)
                            .values(post)
                            .useTransaction(true)
                            .execute()];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); })); });
    // todo: add tests for update and remove queries as well
});
//# sourceMappingURL=enabling-transaction.js.map