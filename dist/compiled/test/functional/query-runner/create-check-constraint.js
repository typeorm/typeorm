"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var src_1 = require("../../../src");
var TableCheck_1 = require("../../../src/schema-builder/table/TableCheck");
var MysqlDriver_1 = require("../../../src/driver/mysql/MysqlDriver");
describe("query runner > create check constraint", function () {
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
    it("should correctly create check constraint and revert creation", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var queryRunner, driver, check1, check2, check3, table;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    // Mysql does not support check constraints.
                    if (connection.driver instanceof MysqlDriver_1.MysqlDriver)
                        return [2 /*return*/];
                    queryRunner = connection.createQueryRunner();
                    return [4 /*yield*/, queryRunner.createTable(new src_1.Table({
                            name: "question",
                            columns: [
                                {
                                    name: "id",
                                    type: "int",
                                    isPrimary: true
                                },
                                {
                                    name: "name",
                                    type: "varchar",
                                },
                                {
                                    name: "description",
                                    type: "varchar",
                                },
                                {
                                    name: "version",
                                    type: "int",
                                }
                            ]
                        }), true)];
                case 1:
                    _a.sent();
                    // clear sqls in memory to avoid removing tables when down queries executed.
                    queryRunner.clearSqlMemory();
                    driver = connection.driver;
                    check1 = new TableCheck_1.TableCheck({ expression: driver.escape("name") + " <> 'asd' AND " + driver.escape("description") + " <> 'test'" });
                    check2 = new TableCheck_1.TableCheck({ expression: "(" + driver.escape("id") + " < 0 AND " + driver.escape("version") + " < 9999) OR (" + driver.escape("id") + " > 9999 AND " + driver.escape("version") + " < 888)" });
                    check3 = new TableCheck_1.TableCheck({ expression: driver.escape("id") + " + " + driver.escape("version") + " > 0" });
                    return [4 /*yield*/, queryRunner.createCheckConstraints("question", [check1, check2, check3])];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, queryRunner.getTable("question")];
                case 3:
                    table = _a.sent();
                    table.checks.length.should.be.equal(3);
                    return [4 /*yield*/, queryRunner.executeMemoryDownSql()];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, queryRunner.getTable("question")];
                case 5:
                    table = _a.sent();
                    table.checks.length.should.be.equal(0);
                    return [4 /*yield*/, queryRunner.release()];
                case 6:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=create-check-constraint.js.map