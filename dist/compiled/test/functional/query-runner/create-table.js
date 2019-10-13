"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var chai_1 = require("chai");
var CockroachDriver_1 = require("../../../src/driver/cockroachdb/CockroachDriver");
var test_utils_1 = require("../../utils/test-utils");
var Table_1 = require("../../../src/schema-builder/table/Table");
var Post_1 = require("./entity/Post");
var MysqlDriver_1 = require("../../../src/driver/mysql/MysqlDriver");
var AbstractSqliteDriver_1 = require("../../../src/driver/sqlite-abstract/AbstractSqliteDriver");
var OracleDriver_1 = require("../../../src/driver/oracle/OracleDriver");
var Photo_1 = require("./entity/Photo");
describe("query runner > create table", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                        dropSchema: true,
                    })];
                case 1:
                    connections = _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should correctly create table from simple object and revert creation", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var queryRunner, options, table, idColumn, nameColumn;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    queryRunner = connection.createQueryRunner();
                    options = {
                        name: "category",
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
                                isUnique: true,
                                isNullable: false
                            }
                        ]
                    };
                    return [4 /*yield*/, queryRunner.createTable(new Table_1.Table(options), true)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, queryRunner.getTable("category")];
                case 2:
                    table = _a.sent();
                    idColumn = table.findColumnByName("id");
                    nameColumn = table.findColumnByName("name");
                    idColumn.should.be.exist;
                    idColumn.isPrimary.should.be.true;
                    idColumn.isGenerated.should.be.true;
                    idColumn.generationStrategy.should.be.equal("increment");
                    nameColumn.should.be.exist;
                    nameColumn.isUnique.should.be.true;
                    table.should.exist;
                    if (!(connection.driver instanceof MysqlDriver_1.MysqlDriver))
                        table.uniques.length.should.be.equal(1);
                    return [4 /*yield*/, queryRunner.executeMemoryDownSql()];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, queryRunner.getTable("category")];
                case 4:
                    table = _a.sent();
                    chai_1.expect(table).to.be.undefined;
                    return [4 /*yield*/, queryRunner.release()];
                case 5:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should correctly create table from Entity", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var queryRunner, metadata, newTable, table, idColumn, versionColumn, nameColumn;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    queryRunner = connection.createQueryRunner();
                    metadata = connection.getMetadata(Post_1.Post);
                    newTable = Table_1.Table.create(metadata, connection.driver);
                    return [4 /*yield*/, queryRunner.createTable(newTable)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, queryRunner.getTable("post")];
                case 2:
                    table = _a.sent();
                    idColumn = table.findColumnByName("id");
                    versionColumn = table.findColumnByName("version");
                    nameColumn = table.findColumnByName("name");
                    table.should.exist;
                    if (!(connection.driver instanceof MysqlDriver_1.MysqlDriver)) {
                        table.uniques.length.should.be.equal(2);
                        table.checks.length.should.be.equal(1);
                    }
                    idColumn.isPrimary.should.be.true;
                    versionColumn.isUnique.should.be.true;
                    nameColumn.default.should.be.exist;
                    return [4 /*yield*/, queryRunner.release()];
                case 3:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should correctly create table with all dependencies and revert creation", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var queryRunner, questionTableOptions, categoryTableOptions, personTable, personIdColumn, personUserIdColumn, questionTable, questionIdColumn, categoryTable, categoryTableIdColumn;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    queryRunner = connection.createQueryRunner();
                    return [4 /*yield*/, queryRunner.createTable(new Table_1.Table({
                            name: "person",
                            columns: [
                                {
                                    name: "id",
                                    type: "int",
                                    isPrimary: true
                                },
                                {
                                    name: "userId",
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
                    questionTableOptions = {
                        name: "question",
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
                            },
                            {
                                name: "text",
                                type: "varchar",
                                isNullable: false
                            },
                            {
                                name: "authorId",
                                type: "int"
                            },
                            {
                                name: "authorUserId",
                                type: "int"
                            }
                        ],
                        indices: [{ columnNames: ["authorId", "authorUserId"], isUnique: true }],
                        foreignKeys: [
                            {
                                columnNames: ["authorId", "authorUserId"],
                                referencedTableName: "person",
                                referencedColumnNames: ["id", "userId"]
                            }
                        ]
                    };
                    if (connection.driver instanceof MysqlDriver_1.MysqlDriver) {
                        questionTableOptions.indices.push({ columnNames: ["name", "text"] });
                    }
                    else {
                        questionTableOptions.uniques = [{ columnNames: ["name", "text"] }];
                        questionTableOptions.checks = [{ expression: connection.driver.escape("name") + " <> 'ASD'" }];
                    }
                    return [4 /*yield*/, queryRunner.createTable(new Table_1.Table(questionTableOptions), true)];
                case 2:
                    _a.sent();
                    categoryTableOptions = {
                        name: "category",
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
                                default: "'default category'",
                                isUnique: true,
                                isNullable: false
                            },
                            {
                                name: "alternativeName",
                                type: "varchar",
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
                                referencedTableName: "question",
                                referencedColumnNames: ["id"]
                            }
                        ]
                    };
                    if (connection.driver instanceof MysqlDriver_1.MysqlDriver) {
                        categoryTableOptions.indices = [{ columnNames: ["name", "alternativeName"] }];
                    }
                    else {
                        categoryTableOptions.uniques = [{ columnNames: ["name", "alternativeName"] }];
                    }
                    // When we mark column as unique, MySql create index for that column and we don't need to create index separately.
                    if (!(connection.driver instanceof MysqlDriver_1.MysqlDriver) && !(connection.driver instanceof OracleDriver_1.OracleDriver))
                        categoryTableOptions.indices = [{ columnNames: ["questionId"] }];
                    return [4 /*yield*/, queryRunner.createTable(new Table_1.Table(categoryTableOptions), true)];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, queryRunner.getTable("person")];
                case 4:
                    personTable = _a.sent();
                    personIdColumn = personTable.findColumnByName("id");
                    personUserIdColumn = personTable.findColumnByName("id");
                    personIdColumn.isPrimary.should.be.true;
                    personUserIdColumn.isPrimary.should.be.true;
                    personTable.should.exist;
                    return [4 /*yield*/, queryRunner.getTable("question")];
                case 5:
                    questionTable = _a.sent();
                    questionIdColumn = questionTable.findColumnByName("id");
                    questionIdColumn.isPrimary.should.be.true;
                    questionIdColumn.isGenerated.should.be.true;
                    questionIdColumn.generationStrategy.should.be.equal("increment");
                    questionTable.should.exist;
                    if (connection.driver instanceof MysqlDriver_1.MysqlDriver) {
                        // MySql driver does not have unique and check constraints.
                        // all unique constraints is unique indexes.
                        questionTable.uniques.length.should.be.equal(0);
                        questionTable.indices.length.should.be.equal(2);
                    }
                    else if (connection.driver instanceof CockroachDriver_1.CockroachDriver) {
                        // CockroachDB stores unique indices as UNIQUE constraints
                        questionTable.uniques.length.should.be.equal(2);
                        questionTable.uniques[0].columnNames.length.should.be.equal(2);
                        questionTable.uniques[1].columnNames.length.should.be.equal(2);
                        questionTable.indices.length.should.be.equal(0);
                        questionTable.checks.length.should.be.equal(1);
                    }
                    else {
                        questionTable.uniques.length.should.be.equal(1);
                        questionTable.uniques[0].columnNames.length.should.be.equal(2);
                        questionTable.indices.length.should.be.equal(1);
                        questionTable.indices[0].columnNames.length.should.be.equal(2);
                        questionTable.checks.length.should.be.equal(1);
                    }
                    questionTable.foreignKeys.length.should.be.equal(1);
                    questionTable.foreignKeys[0].columnNames.length.should.be.equal(2);
                    questionTable.foreignKeys[0].referencedColumnNames.length.should.be.equal(2);
                    return [4 /*yield*/, queryRunner.getTable("category")];
                case 6:
                    categoryTable = _a.sent();
                    categoryTableIdColumn = categoryTable.findColumnByName("id");
                    categoryTableIdColumn.isPrimary.should.be.true;
                    categoryTableIdColumn.isGenerated.should.be.true;
                    categoryTableIdColumn.generationStrategy.should.be.equal("increment");
                    categoryTable.should.exist;
                    categoryTable.foreignKeys.length.should.be.equal(1);
                    if (connection.driver instanceof MysqlDriver_1.MysqlDriver) {
                        // MySql driver does not have unique constraints. All unique constraints is unique indexes.
                        categoryTable.indices.length.should.be.equal(3);
                    }
                    else if (connection.driver instanceof OracleDriver_1.OracleDriver) {
                        // Oracle does not allow to put index on primary or unique columns.
                        categoryTable.indices.length.should.be.equal(0);
                    }
                    else {
                        categoryTable.uniques.length.should.be.equal(3);
                        categoryTable.indices.length.should.be.equal(1);
                    }
                    return [4 /*yield*/, queryRunner.executeMemoryDownSql()];
                case 7:
                    _a.sent();
                    return [4 /*yield*/, queryRunner.getTable("question")];
                case 8:
                    questionTable = _a.sent();
                    return [4 /*yield*/, queryRunner.getTable("category")];
                case 9:
                    categoryTable = _a.sent();
                    return [4 /*yield*/, queryRunner.getTable("person")];
                case 10:
                    personTable = _a.sent();
                    chai_1.expect(questionTable).to.be.undefined;
                    chai_1.expect(categoryTable).to.be.undefined;
                    chai_1.expect(personTable).to.be.undefined;
                    return [4 /*yield*/, queryRunner.release()];
                case 11:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should correctly create table with different `Unique` definitions", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var queryRunner, metadata, newTable, table, nameColumn, tagColumn, descriptionColumn, textColumn;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    queryRunner = connection.createQueryRunner();
                    metadata = connection.getMetadata(Photo_1.Photo);
                    newTable = Table_1.Table.create(metadata, connection.driver);
                    return [4 /*yield*/, queryRunner.createTable(newTable)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, queryRunner.getTable("photo")];
                case 2:
                    table = _a.sent();
                    nameColumn = table.findColumnByName("name");
                    tagColumn = table.findColumnByName("tag");
                    descriptionColumn = table.findColumnByName("description");
                    textColumn = table.findColumnByName("text");
                    table.should.exist;
                    nameColumn.isUnique.should.be.true;
                    descriptionColumn.isUnique.should.be.true;
                    if (connection.driver instanceof MysqlDriver_1.MysqlDriver) {
                        table.uniques.length.should.be.equal(0);
                        table.indices.length.should.be.equal(4);
                        tagColumn.isUnique.should.be.true;
                        textColumn.isUnique.should.be.true;
                    }
                    else if (connection.driver instanceof CockroachDriver_1.CockroachDriver) {
                        // CockroachDB stores unique indices as UNIQUE constraints
                        table.uniques.length.should.be.equal(4);
                        table.indices.length.should.be.equal(0);
                        tagColumn.isUnique.should.be.true;
                        textColumn.isUnique.should.be.true;
                    }
                    else {
                        table.uniques.length.should.be.equal(2);
                        table.indices.length.should.be.equal(2);
                        tagColumn.isUnique.should.be.false;
                        textColumn.isUnique.should.be.false;
                    }
                    return [4 /*yield*/, queryRunner.executeMemoryDownSql()];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, queryRunner.getTable("photo")];
                case 4:
                    table = _a.sent();
                    chai_1.expect(table).to.be.undefined;
                    return [4 /*yield*/, queryRunner.release()];
                case 5:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=create-table.js.map