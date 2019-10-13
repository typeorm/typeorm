"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
describe("query runner > create and drop database", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                        enabledDrivers: ["mysql", "mssql", "cockroachdb"],
                        dropSchema: true,
                    })];
                case 1:
                    connections = _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should correctly create and drop database and revert it", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var queryRunner, hasDatabase;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    queryRunner = connection.createQueryRunner();
                    return [4 /*yield*/, queryRunner.createDatabase("myTestDatabase", true)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, queryRunner.hasDatabase("myTestDatabase")];
                case 2:
                    hasDatabase = _a.sent();
                    hasDatabase.should.be.true;
                    return [4 /*yield*/, queryRunner.dropDatabase("myTestDatabase")];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, queryRunner.hasDatabase("myTestDatabase")];
                case 4:
                    hasDatabase = _a.sent();
                    hasDatabase.should.be.false;
                    return [4 /*yield*/, queryRunner.executeMemoryDownSql()];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, queryRunner.hasDatabase("myTestDatabase")];
                case 6:
                    hasDatabase = _a.sent();
                    hasDatabase.should.be.false;
                    return [4 /*yield*/, queryRunner.release()];
                case 7:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=create-and-drop-database.js.map