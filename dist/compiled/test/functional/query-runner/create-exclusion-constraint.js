"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var src_1 = require("../../../src");
var TableExclusion_1 = require("../../../src/schema-builder/table/TableExclusion");
describe("query runner > create exclusion constraint", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                        enabledDrivers: ["postgres"],
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
    it("should correctly create exclusion constraint and revert creation", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var queryRunner, driver, exclusion1, exclusion2, table;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
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
                    exclusion1 = new TableExclusion_1.TableExclusion({ expression: "USING gist (" + driver.escape("name") + " WITH =)" });
                    exclusion2 = new TableExclusion_1.TableExclusion({ expression: "USING gist (" + driver.escape("id") + " WITH =)" });
                    return [4 /*yield*/, queryRunner.createExclusionConstraints("question", [exclusion1, exclusion2])];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, queryRunner.getTable("question")];
                case 3:
                    table = _a.sent();
                    table.exclusions.length.should.be.equal(2);
                    return [4 /*yield*/, queryRunner.executeMemoryDownSql()];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, queryRunner.getTable("question")];
                case 5:
                    table = _a.sent();
                    table.exclusions.length.should.be.equal(0);
                    return [4 /*yield*/, queryRunner.release()];
                case 6:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=create-exclusion-constraint.js.map