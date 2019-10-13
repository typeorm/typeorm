"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var Foo_1 = require("./entity/Foo");
var chai_1 = require("chai");
describe("github issues > #2499 Postgres DELETE query result is useless", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                        schemaCreate: true,
                        dropSchema: true,
                    })];
                case 1: return [2 /*return*/, connections = _a.sent()];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should return correct number of affected rows for mysql, mariadb, postgres", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var repo, result;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    // skip test for sqlite because sqlite doesn't return any data on delete
                    // sqljs -- the same
                    // mongodb requires another test and it is also doesn't return correct number
                    // of removed documents (possibly a bug with mongodb itself)
                    if (["mysql", "mariadb", "mssql", "postgres"].indexOf(connection.name) === -1) {
                        return [2 /*return*/];
                    }
                    repo = connection.getRepository(Foo_1.Foo);
                    return [4 /*yield*/, repo.save({ id: 1, description: "test1" })];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, repo.save({ id: 2, description: "test2" })];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, repo.save({ id: 3, description: "test3" })];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, repo.delete([1, 2, 3, 4])];
                case 4:
                    result = _a.sent();
                    chai_1.expect(result.affected).to.eql(3);
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-2499.js.map