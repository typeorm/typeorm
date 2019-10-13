"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var chai_1 = require("chai");
describe("github issues > #945 synchronization with multiple primary keys", function () {
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
    it("schema should include two primary keys", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var queryRunner, table, firstId, secondId;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    queryRunner = connection.createQueryRunner();
                    return [4 /*yield*/, queryRunner.getTable("test_entity")];
                case 1:
                    table = _a.sent();
                    if (table) {
                        firstId = table.columns.find(function (column) { return column.name === "id1"; });
                        secondId = table.columns.find(function (column) { return column.name === "id2"; });
                        chai_1.expect(table.columns.filter(function (column) { return column.isPrimary; })).length(2);
                        chai_1.expect(firstId).not.to.be.undefined;
                        chai_1.expect(secondId).not.to.be.undefined;
                    }
                    return [4 /*yield*/, queryRunner.release()];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-945.js.map