"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var Table_1 = require("../../../src/schema-builder/table/Table");
var TableUnique_1 = require("../../../src/schema-builder/table/TableUnique");
describe("query runner > create unique constraint", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                        enabledDrivers: ["mssql", "postgres", "sqlite", "oracle", "cockroachdb"],
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
    it("should correctly create unique constraint and revert creation", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var queryRunner, categoryUniqueConstraint, questionUniqueConstraint, categoryTable, questionTable;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    queryRunner = connection.createQueryRunner();
                    return [4 /*yield*/, queryRunner.createTable(new Table_1.Table({
                            name: "category",
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
                                }
                            ]
                        }), true)];
                case 2:
                    _a.sent();
                    // clear sqls in memory to avoid removing tables when down queries executed.
                    queryRunner.clearSqlMemory();
                    categoryUniqueConstraint = new TableUnique_1.TableUnique({ columnNames: ["name"] });
                    return [4 /*yield*/, queryRunner.createUniqueConstraint("category", categoryUniqueConstraint)];
                case 3:
                    _a.sent();
                    questionUniqueConstraint = new TableUnique_1.TableUnique({ columnNames: ["name", "description"] });
                    return [4 /*yield*/, queryRunner.createUniqueConstraint("question", questionUniqueConstraint)];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, queryRunner.getTable("category")];
                case 5:
                    categoryTable = _a.sent();
                    categoryTable.findColumnByName("name").isUnique.should.be.true;
                    categoryTable.uniques.length.should.be.equal(1);
                    return [4 /*yield*/, queryRunner.getTable("question")];
                case 6:
                    questionTable = _a.sent();
                    // when unique constraint defined on multiple columns. each of this columns must be non-unique,
                    // because they are unique only in complex.
                    questionTable.findColumnByName("name").isUnique.should.be.false;
                    questionTable.findColumnByName("description").isUnique.should.be.false;
                    questionTable.uniques.length.should.be.equal(1);
                    return [4 /*yield*/, queryRunner.executeMemoryDownSql()];
                case 7:
                    _a.sent();
                    return [4 /*yield*/, queryRunner.getTable("category")];
                case 8:
                    categoryTable = _a.sent();
                    categoryTable.findColumnByName("name").isUnique.should.be.false;
                    categoryTable.uniques.length.should.be.equal(0);
                    return [4 /*yield*/, queryRunner.getTable("question")];
                case 9:
                    questionTable = _a.sent();
                    questionTable.findColumnByName("name").isUnique.should.be.false;
                    questionTable.findColumnByName("description").isUnique.should.be.false;
                    questionTable.uniques.length.should.be.equal(0);
                    return [4 /*yield*/, queryRunner.release()];
                case 10:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=create-unique-constraint.js.map