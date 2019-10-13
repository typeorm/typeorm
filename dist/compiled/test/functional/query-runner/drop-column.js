"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var chai_1 = require("chai");
var CockroachDriver_1 = require("../../../src/driver/cockroachdb/CockroachDriver");
var test_utils_1 = require("../../utils/test-utils");
describe("query runner > drop column", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                        schemaCreate: true,
                        dropSchema: true,
                    })];
                case 1:
                    connections = _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should correctly drop column and revert drop", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var queryRunner, table, idColumn, nameColumn, versionColumn;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    queryRunner = connection.createQueryRunner();
                    return [4 /*yield*/, queryRunner.getTable("post")];
                case 1:
                    table = _a.sent();
                    idColumn = table.findColumnByName("id");
                    nameColumn = table.findColumnByName("name");
                    versionColumn = table.findColumnByName("version");
                    idColumn.should.be.exist;
                    nameColumn.should.be.exist;
                    versionColumn.should.be.exist;
                    if (!(connection.driver instanceof CockroachDriver_1.CockroachDriver)) return [3 /*break*/, 3];
                    return [4 /*yield*/, queryRunner.dropColumns(table, [nameColumn, versionColumn])];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 5];
                case 3: return [4 /*yield*/, queryRunner.dropColumns(table, [idColumn, nameColumn, versionColumn])];
                case 4:
                    _a.sent();
                    _a.label = 5;
                case 5: return [4 /*yield*/, queryRunner.getTable("post")];
                case 6:
                    table = _a.sent();
                    chai_1.expect(table.findColumnByName("name")).to.be.undefined;
                    chai_1.expect(table.findColumnByName("version")).to.be.undefined;
                    if (!(connection.driver instanceof CockroachDriver_1.CockroachDriver))
                        chai_1.expect(table.findColumnByName("id")).to.be.undefined;
                    return [4 /*yield*/, queryRunner.executeMemoryDownSql()];
                case 7:
                    _a.sent();
                    return [4 /*yield*/, queryRunner.getTable("post")];
                case 8:
                    table = _a.sent();
                    table.findColumnByName("id").should.be.exist;
                    table.findColumnByName("name").should.be.exist;
                    table.findColumnByName("version").should.be.exist;
                    return [4 /*yield*/, queryRunner.release()];
                case 9:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=drop-column.js.map