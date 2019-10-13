"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var CockroachDriver_1 = require("../../../src/driver/cockroachdb/CockroachDriver");
var test_utils_1 = require("../../utils/test-utils");
var SqlServerDriver_1 = require("../../../src/driver/sqlserver/SqlServerDriver");
var Table_1 = require("../../../src/schema-builder/table/Table");
var AbstractSqliteDriver_1 = require("../../../src/driver/sqlite-abstract/AbstractSqliteDriver");
var PostgresDriver_1 = require("../../../src/driver/postgres/PostgresDriver");
var MysqlDriver_1 = require("../../../src/driver/mysql/MysqlDriver");
describe("query runner > rename table", function () {
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
    it("should correctly rename table and revert rename", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var queryRunner, table;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    // CockroachDB does not support renaming constraints and removing PK.
                    if (connection.driver instanceof CockroachDriver_1.CockroachDriver)
                        return [2 /*return*/];
                    queryRunner = connection.createQueryRunner();
                    return [4 /*yield*/, queryRunner.getTable("post")];
                case 1:
                    table = _a.sent();
                    return [4 /*yield*/, queryRunner.renameTable(table, "question")];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, queryRunner.getTable("question")];
                case 3:
                    table = _a.sent();
                    table.should.be.exist;
                    return [4 /*yield*/, queryRunner.renameTable("question", "user")];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, queryRunner.getTable("user")];
                case 5:
                    table = _a.sent();
                    table.should.be.exist;
                    return [4 /*yield*/, queryRunner.executeMemoryDownSql()];
                case 6:
                    _a.sent();
                    return [4 /*yield*/, queryRunner.getTable("post")];
                case 7:
                    table = _a.sent();
                    table.should.be.exist;
                    return [4 /*yield*/, queryRunner.release()];
                case 8:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should correctly rename table with all constraints depend to that table and revert rename", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var queryRunner, table, newUniqueConstraintName, tableUnique;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    // CockroachDB does not support renaming constraints and removing PK.
                    if (connection.driver instanceof CockroachDriver_1.CockroachDriver)
                        return [2 /*return*/];
                    queryRunner = connection.createQueryRunner();
                    return [4 /*yield*/, queryRunner.getTable("post")];
                case 1:
                    table = _a.sent();
                    return [4 /*yield*/, queryRunner.renameTable(table, "renamedPost")];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, queryRunner.getTable("renamedPost")];
                case 3:
                    table = _a.sent();
                    table.should.be.exist;
                    // should successfully drop pk if pk constraint was correctly renamed.
                    return [4 /*yield*/, queryRunner.dropPrimaryKey(table)];
                case 4:
                    // should successfully drop pk if pk constraint was correctly renamed.
                    _a.sent();
                    // MySql does not support unique constraints
                    if (!(connection.driver instanceof MysqlDriver_1.MysqlDriver)) {
                        newUniqueConstraintName = connection.namingStrategy.uniqueConstraintName(table, ["text", "tag"]);
                        tableUnique = table.uniques.find(function (unique) {
                            return !!unique.columnNames.find(function (columnName) { return columnName === "tag"; });
                        });
                        tableUnique.name.should.be.equal(newUniqueConstraintName);
                    }
                    return [4 /*yield*/, queryRunner.executeMemoryDownSql()];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, queryRunner.getTable("post")];
                case 6:
                    table = _a.sent();
                    table.should.be.exist;
                    return [4 /*yield*/, queryRunner.release()];
                case 7:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should correctly rename table with custom schema and database and all its dependencies and revert rename", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var queryRunner, table, questionTableName, renamedQuestionTableName, categoryTableName, renamedCategoryTableName, newIndexName, newForeignKeyName;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    // CockroachDB does not support renaming constraints and removing PK.
                    if (connection.driver instanceof CockroachDriver_1.CockroachDriver)
                        return [2 /*return*/];
                    queryRunner = connection.createQueryRunner();
                    questionTableName = "question";
                    renamedQuestionTableName = "renamedQuestion";
                    categoryTableName = "category";
                    renamedCategoryTableName = "renamedCategory";
                    if (!(connection.driver instanceof SqlServerDriver_1.SqlServerDriver)) return [3 /*break*/, 3];
                    questionTableName = "testDB.testSchema.question";
                    renamedQuestionTableName = "testDB.testSchema.renamedQuestion";
                    categoryTableName = "testDB.testSchema.category";
                    renamedCategoryTableName = "testDB.testSchema.renamedCategory";
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
                    renamedQuestionTableName = "testSchema.renamedQuestion";
                    categoryTableName = "testSchema.category";
                    renamedCategoryTableName = "testSchema.renamedCategory";
                    return [4 /*yield*/, queryRunner.createSchema("testSchema", true)];
                case 4:
                    _a.sent();
                    return [3 /*break*/, 7];
                case 5:
                    if (!(connection.driver instanceof MysqlDriver_1.MysqlDriver)) return [3 /*break*/, 7];
                    questionTableName = "testDB.question";
                    renamedQuestionTableName = "testDB.renamedQuestion";
                    categoryTableName = "testDB.category";
                    renamedCategoryTableName = "testDB.renamedCategory";
                    return [4 /*yield*/, queryRunner.createDatabase("testDB", true)];
                case 6:
                    _a.sent();
                    _a.label = 7;
                case 7: return [4 /*yield*/, queryRunner.createTable(new Table_1.Table({
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
                    return [4 /*yield*/, queryRunner.createTable(new Table_1.Table({
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
                    return [4 /*yield*/, queryRunner.renameTable(questionTableName, "renamedQuestion")];
                case 10:
                    _a.sent();
                    return [4 /*yield*/, queryRunner.getTable(renamedQuestionTableName)];
                case 11:
                    table = _a.sent();
                    newIndexName = connection.namingStrategy.indexName(table, ["name"]);
                    table.indices[0].name.should.be.equal(newIndexName);
                    return [4 /*yield*/, queryRunner.renameTable(categoryTableName, "renamedCategory")];
                case 12:
                    _a.sent();
                    return [4 /*yield*/, queryRunner.getTable(renamedCategoryTableName)];
                case 13:
                    table = _a.sent();
                    newForeignKeyName = connection.namingStrategy.foreignKeyName(table, ["questionId"], "question", ["id"]);
                    table.foreignKeys[0].name.should.be.equal(newForeignKeyName);
                    return [4 /*yield*/, queryRunner.executeMemoryDownSql()];
                case 14:
                    _a.sent();
                    return [4 /*yield*/, queryRunner.getTable(questionTableName)];
                case 15:
                    table = _a.sent();
                    table.should.be.exist;
                    return [4 /*yield*/, queryRunner.getTable(categoryTableName)];
                case 16:
                    table = _a.sent();
                    table.should.be.exist;
                    return [4 /*yield*/, queryRunner.release()];
                case 17:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=rename-table.js.map