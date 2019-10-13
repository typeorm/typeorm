"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var CockroachDriver_1 = require("../../../src/driver/cockroachdb/CockroachDriver");
var test_utils_1 = require("../../utils/test-utils");
var Table_1 = require("../../../src/schema-builder/table/Table");
describe("query runner > create primary key", function () {
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
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should correctly create primary key and revert creation", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var queryRunner, categoryTable, personTable;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    // CockroachDB does not allow altering primary key
                    if (connection.driver instanceof CockroachDriver_1.CockroachDriver)
                        return [2 /*return*/];
                    queryRunner = connection.createQueryRunner();
                    return [4 /*yield*/, queryRunner.createTable(new Table_1.Table({
                            name: "category",
                            columns: [
                                {
                                    name: "id",
                                    type: "int",
                                },
                                {
                                    name: "name",
                                    type: "varchar",
                                }
                            ]
                        }), true)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, queryRunner.createTable(new Table_1.Table({
                            name: "person",
                            columns: [
                                {
                                    name: "id",
                                    type: "int",
                                },
                                {
                                    name: "userId",
                                    type: "int",
                                },
                                {
                                    name: "name",
                                    type: "varchar",
                                }
                            ]
                        }), true)];
                case 2:
                    _a.sent();
                    // clear sqls in memory to avoid removing tables when down queries executed.
                    queryRunner.clearSqlMemory();
                    return [4 /*yield*/, queryRunner.createPrimaryKey("category", ["id"])];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, queryRunner.createPrimaryKey("person", ["id", "userId"])];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, queryRunner.getTable("category")];
                case 5:
                    categoryTable = _a.sent();
                    categoryTable.findColumnByName("id").isPrimary.should.be.true;
                    return [4 /*yield*/, queryRunner.getTable("person")];
                case 6:
                    personTable = _a.sent();
                    personTable.findColumnByName("id").isPrimary.should.be.true;
                    personTable.findColumnByName("userId").isPrimary.should.be.true;
                    return [4 /*yield*/, queryRunner.executeMemoryDownSql()];
                case 7:
                    _a.sent();
                    return [4 /*yield*/, queryRunner.getTable("category")];
                case 8:
                    categoryTable = _a.sent();
                    categoryTable.findColumnByName("id").isPrimary.should.be.false;
                    return [4 /*yield*/, queryRunner.getTable("person")];
                case 9:
                    personTable = _a.sent();
                    personTable.findColumnByName("id").isPrimary.should.be.false;
                    personTable.findColumnByName("userId").isPrimary.should.be.false;
                    return [4 /*yield*/, queryRunner.release()];
                case 10:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=create-primary-key.js.map