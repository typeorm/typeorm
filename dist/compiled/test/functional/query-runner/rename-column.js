"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var chai_1 = require("chai");
var CockroachDriver_1 = require("../../../src/driver/cockroachdb/CockroachDriver");
var test_utils_1 = require("../../utils/test-utils");
var src_1 = require("../../../src");
var SqlServerDriver_1 = require("../../../src/driver/sqlserver/SqlServerDriver");
var PostgresDriver_1 = require("../../../src/driver/postgres/PostgresDriver");
var AbstractSqliteDriver_1 = require("../../../src/driver/sqlite-abstract/AbstractSqliteDriver");
var MysqlDriver_1 = require("../../../src/driver/mysql/MysqlDriver");
describe("query runner > rename column", function () {
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
    it("should correctly rename column and revert rename", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var queryRunner, table, textColumn, renamedTextColumn;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    // TODO: https://github.com/cockroachdb/cockroach/issues/32555
                    if (connection.driver instanceof CockroachDriver_1.CockroachDriver)
                        return [2 /*return*/];
                    queryRunner = connection.createQueryRunner();
                    return [4 /*yield*/, queryRunner.getTable("post")];
                case 1:
                    table = _a.sent();
                    textColumn = table.findColumnByName("text");
                    renamedTextColumn = textColumn.clone();
                    renamedTextColumn.name = "description";
                    return [4 /*yield*/, queryRunner.renameColumn(table, textColumn, renamedTextColumn)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, queryRunner.renameColumn(table, "name", "title")];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, queryRunner.getTable("post")];
                case 4:
                    table = _a.sent();
                    chai_1.expect(table.findColumnByName("name")).to.be.undefined;
                    chai_1.expect(table.findColumnByName("text")).to.be.undefined;
                    table.findColumnByName("title").should.be.exist;
                    table.findColumnByName("description").should.be.exist;
                    return [4 /*yield*/, queryRunner.executeMemoryDownSql()];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, queryRunner.getTable("post")];
                case 6:
                    table = _a.sent();
                    table.findColumnByName("name").should.be.exist;
                    table.findColumnByName("text").should.be.exist;
                    chai_1.expect(table.findColumnByName("title")).to.be.undefined;
                    chai_1.expect(table.findColumnByName("description")).to.be.undefined;
                    return [4 /*yield*/, queryRunner.release()];
                case 7:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should correctly rename column with all constraints and revert rename", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var queryRunner, table, idColumn, oldUniqueConstraintName, tableUnique, newUniqueConstraintName;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    // TODO: https://github.com/cockroachdb/cockroach/issues/32555
                    if (connection.driver instanceof CockroachDriver_1.CockroachDriver)
                        return [2 /*return*/];
                    queryRunner = connection.createQueryRunner();
                    return [4 /*yield*/, queryRunner.getTable("post")];
                case 1:
                    table = _a.sent();
                    idColumn = table.findColumnByName("id");
                    return [4 /*yield*/, queryRunner.renameColumn(table, idColumn, "id2")];
                case 2:
                    _a.sent();
                    if (!!(connection.driver instanceof CockroachDriver_1.CockroachDriver)) return [3 /*break*/, 4];
                    return [4 /*yield*/, queryRunner.dropPrimaryKey(table)];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4: return [4 /*yield*/, queryRunner.getTable("post")];
                case 5:
                    table = _a.sent();
                    chai_1.expect(table.findColumnByName("id")).to.be.undefined;
                    table.findColumnByName("id2").should.be.exist;
                    if (!!(connection.driver instanceof MysqlDriver_1.MysqlDriver)) return [3 /*break*/, 8];
                    oldUniqueConstraintName = connection.namingStrategy.uniqueConstraintName(table, ["text", "tag"]);
                    tableUnique = table.uniques.find(function (unique) {
                        return !!unique.columnNames.find(function (columnName) { return columnName === "tag"; });
                    });
                    tableUnique.name.should.be.equal(oldUniqueConstraintName);
                    return [4 /*yield*/, queryRunner.renameColumn(table, "text", "text2")];
                case 6:
                    _a.sent();
                    return [4 /*yield*/, queryRunner.getTable("post")];
                case 7:
                    table = _a.sent();
                    newUniqueConstraintName = connection.namingStrategy.uniqueConstraintName(table, ["text2", "tag"]);
                    tableUnique = table.uniques.find(function (unique) {
                        return !!unique.columnNames.find(function (columnName) { return columnName === "tag"; });
                    });
                    tableUnique.name.should.be.equal(newUniqueConstraintName);
                    _a.label = 8;
                case 8: return [4 /*yield*/, queryRunner.executeMemoryDownSql()];
                case 9:
                    _a.sent();
                    return [4 /*yield*/, queryRunner.getTable("post")];
                case 10:
                    table = _a.sent();
                    table.findColumnByName("id").should.be.exist;
                    chai_1.expect(table.findColumnByName("id2")).to.be.undefined;
                    return [4 /*yield*/, queryRunner.release()];
                case 11:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should correctly rename column with all constraints in custom table schema and database and revert rename", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var queryRunner, table, questionTableName, categoryTableName, newIndexName, newForeignKeyName;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    // TODO: https://github.com/cockroachdb/cockroach/issues/32555
                    if (connection.driver instanceof CockroachDriver_1.CockroachDriver)
                        return [2 /*return*/];
                    queryRunner = connection.createQueryRunner();
                    questionTableName = "question";
                    categoryTableName = "category";
                    if (!(connection.driver instanceof SqlServerDriver_1.SqlServerDriver)) return [3 /*break*/, 3];
                    questionTableName = "testDB.testSchema.question";
                    categoryTableName = "testDB.testSchema.category";
                    return [4 /*yield*/, queryRunner.createDatabase("testDB", true)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, queryRunner.createSchema("testDB.testSchema", true)];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 7];
                case 3:
                    if (!(connection.driver instanceof PostgresDriver_1.PostgresDriver)) return [3 /*break*/, 5];
                    questionTableName = "testSchema.question";
                    categoryTableName = "testSchema.category";
                    return [4 /*yield*/, queryRunner.createSchema("testSchema", true)];
                case 4:
                    _a.sent();
                    return [3 /*break*/, 7];
                case 5:
                    if (!(connection.driver instanceof MysqlDriver_1.MysqlDriver)) return [3 /*break*/, 7];
                    questionTableName = "testDB.question";
                    categoryTableName = "testDB.category";
                    return [4 /*yield*/, queryRunner.createDatabase("testDB", true)];
                case 6:
                    _a.sent();
                    _a.label = 7;
                case 7: return [4 /*yield*/, queryRunner.createTable(new src_1.Table({
                        name: questionTableName,
                        columns: [
                            {
                                name: "id",
                                type: connection.driver instanceof AbstractSqliteDriver_1.AbstractSqliteDriver ? "integer" : "int",
                                isPrimary: true,
                                isGenerated: true,
                                generationStrategy: "increment"
                            },
                            {
                                name: "name",
                                type: "varchar",
                            }
                        ],
                        indices: [{ columnNames: ["name"] }]
                    }), true)];
                case 8:
                    _a.sent();
                    return [4 /*yield*/, queryRunner.createTable(new src_1.Table({
                            name: categoryTableName,
                            columns: [
                                {
                                    name: "id",
                                    type: connection.driver instanceof AbstractSqliteDriver_1.AbstractSqliteDriver ? "integer" : "int",
                                    isPrimary: true,
                                    isGenerated: true,
                                    generationStrategy: "increment"
                                },
                                {
                                    name: "questionId",
                                    type: "int",
                                    isUnique: true
                                }
                            ],
                            foreignKeys: [
                                {
                                    columnNames: ["questionId"],
                                    referencedTableName: questionTableName,
                                    referencedColumnNames: ["id"]
                                }
                            ]
                        }), true)];
                case 9:
                    _a.sent();
                    // clear sqls in memory to avoid removing tables when down queries executed.
                    queryRunner.clearSqlMemory();
                    return [4 /*yield*/, queryRunner.renameColumn(questionTableName, "name", "name2")];
                case 10:
                    _a.sent();
                    return [4 /*yield*/, queryRunner.getTable(questionTableName)];
                case 11:
                    table = _a.sent();
                    newIndexName = connection.namingStrategy.indexName(table, ["name2"]);
                    table.indices[0].name.should.be.equal(newIndexName);
                    return [4 /*yield*/, queryRunner.renameColumn(categoryTableName, "questionId", "questionId2")];
                case 12:
                    _a.sent();
                    return [4 /*yield*/, queryRunner.getTable(categoryTableName)];
                case 13:
                    table = _a.sent();
                    newForeignKeyName = connection.namingStrategy.foreignKeyName(table, ["questionId2"], "question", ["id"]);
                    table.foreignKeys[0].name.should.be.equal(newForeignKeyName);
                    return [4 /*yield*/, queryRunner.executeMemoryDownSql()];
                case 14:
                    _a.sent();
                    return [4 /*yield*/, queryRunner.getTable(questionTableName)];
                case 15:
                    table = _a.sent();
                    table.findColumnByName("name").should.be.exist;
                    chai_1.expect(table.findColumnByName("name2")).to.be.undefined;
                    return [4 /*yield*/, queryRunner.getTable(categoryTableName)];
                case 16:
                    table = _a.sent();
                    table.findColumnByName("questionId").should.be.exist;
                    chai_1.expect(table.findColumnByName("questionId2")).to.be.undefined;
                    return [4 /*yield*/, queryRunner.release()];
                case 17:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=rename-column.js.map