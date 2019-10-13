"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var CockroachDriver_1 = require("../../../src/driver/cockroachdb/CockroachDriver");
var test_utils_1 = require("../../utils/test-utils");
var Table_1 = require("../../../src/schema-builder/table/Table");
var TableForeignKey_1 = require("../../../src/schema-builder/table/TableForeignKey");
describe("query runner > create foreign key", function () {
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
    it("should correctly create foreign key and revert creation", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var queryRunner, foreignKey, table;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    queryRunner = connection.createQueryRunner();
                    return [4 /*yield*/, queryRunner.createTable(new Table_1.Table({
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
                                }
                            ]
                        }), true)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, queryRunner.createTable(new Table_1.Table({
                            name: "answer",
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
                                    name: "questionId",
                                    isUnique: connection.driver instanceof CockroachDriver_1.CockroachDriver,
                                    type: "int",
                                }
                            ]
                        }), true)];
                case 2:
                    _a.sent();
                    // clear sqls in memory to avoid removing tables when down queries executed.
                    queryRunner.clearSqlMemory();
                    foreignKey = new TableForeignKey_1.TableForeignKey({
                        columnNames: ["questionId"],
                        referencedColumnNames: ["id"],
                        referencedTableName: "question",
                        onDelete: "CASCADE"
                    });
                    return [4 /*yield*/, queryRunner.createForeignKey("answer", foreignKey)];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, queryRunner.getTable("answer")];
                case 4:
                    table = _a.sent();
                    table.foreignKeys.length.should.be.equal(1);
                    return [4 /*yield*/, queryRunner.executeMemoryDownSql()];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, queryRunner.getTable("answer")];
                case 6:
                    table = _a.sent();
                    table.foreignKeys.length.should.be.equal(0);
                    return [4 /*yield*/, queryRunner.release()];
                case 7:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=create-foreign-key.js.map