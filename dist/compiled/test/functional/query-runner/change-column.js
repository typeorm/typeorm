"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var chai_1 = require("chai");
var CockroachDriver_1 = require("../../../src/driver/cockroachdb/CockroachDriver");
var test_utils_1 = require("../../utils/test-utils");
var AbstractSqliteDriver_1 = require("../../../src/driver/sqlite-abstract/AbstractSqliteDriver");
describe("query runner > change column", function () {
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
    it("should correctly change column and revert change", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var queryRunner, table, nameColumn, changedNameColumn, textColumn, changedTextColumn, idColumn, changedIdColumn;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    // CockroachDB does not allow changing primary columns and renaming constraints
                    if (connection.driver instanceof CockroachDriver_1.CockroachDriver)
                        return [2 /*return*/];
                    queryRunner = connection.createQueryRunner();
                    return [4 /*yield*/, queryRunner.getTable("post")];
                case 1:
                    table = _a.sent();
                    nameColumn = table.findColumnByName("name");
                    nameColumn.default.should.exist;
                    nameColumn.isUnique.should.be.false;
                    changedNameColumn = nameColumn.clone();
                    changedNameColumn.default = undefined;
                    changedNameColumn.isUnique = true;
                    changedNameColumn.isNullable = true;
                    changedNameColumn.length = "500";
                    return [4 /*yield*/, queryRunner.changeColumn(table, nameColumn, changedNameColumn)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, queryRunner.getTable("post")];
                case 3:
                    table = _a.sent();
                    chai_1.expect(table.findColumnByName("name").default).to.be.undefined;
                    table.findColumnByName("name").isUnique.should.be.true;
                    table.findColumnByName("name").isNullable.should.be.true;
                    // SQLite does not impose any length restrictions
                    if (!(connection.driver instanceof AbstractSqliteDriver_1.AbstractSqliteDriver))
                        table.findColumnByName("name").length.should.be.equal("500");
                    textColumn = table.findColumnByName("text");
                    changedTextColumn = textColumn.clone();
                    changedTextColumn.name = "description";
                    changedTextColumn.isPrimary = true;
                    changedTextColumn.default = "'default text'";
                    return [4 /*yield*/, queryRunner.changeColumn(table, textColumn, changedTextColumn)];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, queryRunner.getTable("post")];
                case 5:
                    // column name was changed to 'description'
                    table = _a.sent();
                    table.findColumnByName("description").isPrimary.should.be.true;
                    table.findColumnByName("description").default.should.exist;
                    idColumn = table.findColumnByName("id");
                    changedIdColumn = idColumn.clone();
                    changedIdColumn.isPrimary = false;
                    return [4 /*yield*/, queryRunner.changeColumn(table, idColumn, changedIdColumn)];
                case 6:
                    _a.sent();
                    return [4 /*yield*/, queryRunner.getTable("post")];
                case 7:
                    table = _a.sent();
                    table.findColumnByName("id").isPrimary.should.be.false;
                    return [4 /*yield*/, queryRunner.executeMemoryDownSql()];
                case 8:
                    _a.sent();
                    return [4 /*yield*/, queryRunner.getTable("post")];
                case 9:
                    table = _a.sent();
                    table.findColumnByName("id").isPrimary.should.be.true;
                    table.findColumnByName("name").default.should.exist;
                    table.findColumnByName("name").isUnique.should.be.false;
                    table.findColumnByName("name").isNullable.should.be.false;
                    table.findColumnByName("text").isPrimary.should.be.false;
                    chai_1.expect(table.findColumnByName("text").default).to.be.undefined;
                    return [4 /*yield*/, queryRunner.release()];
                case 10:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should correctly change column 'isGenerated' property and revert change", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var queryRunner, table, idColumn, changedIdColumn;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    // CockroachDB does not allow changing generated columns in existent tables
                    if (connection.driver instanceof CockroachDriver_1.CockroachDriver)
                        return [2 /*return*/];
                    queryRunner = connection.createQueryRunner();
                    return [4 /*yield*/, queryRunner.getTable("post")];
                case 1:
                    table = _a.sent();
                    idColumn = table.findColumnByName("id");
                    changedIdColumn = idColumn.clone();
                    changedIdColumn.isGenerated = true;
                    changedIdColumn.generationStrategy = "increment";
                    return [4 /*yield*/, queryRunner.changeColumn(table, idColumn, changedIdColumn)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, queryRunner.getTable("post")];
                case 3:
                    table = _a.sent();
                    table.findColumnByName("id").isGenerated.should.be.true;
                    table.findColumnByName("id").generationStrategy.should.be.equal("increment");
                    return [4 /*yield*/, queryRunner.executeMemoryDownSql()];
                case 4:
                    _a.sent();
                    queryRunner.clearSqlMemory();
                    return [4 /*yield*/, queryRunner.getTable("post")];
                case 5:
                    table = _a.sent();
                    table.findColumnByName("id").isGenerated.should.be.false;
                    chai_1.expect(table.findColumnByName("id").generationStrategy).to.be.undefined;
                    return [4 /*yield*/, queryRunner.getTable("post")];
                case 6:
                    table = _a.sent();
                    idColumn = table.findColumnByName("id");
                    changedIdColumn = idColumn.clone();
                    changedIdColumn.isPrimary = false;
                    return [4 /*yield*/, queryRunner.changeColumn(table, idColumn, changedIdColumn)];
                case 7:
                    _a.sent();
                    return [4 /*yield*/, queryRunner.getTable("post")];
                case 8:
                    // check case when both primary and generated properties set to true
                    table = _a.sent();
                    idColumn = table.findColumnByName("id");
                    changedIdColumn = idColumn.clone();
                    changedIdColumn.isPrimary = true;
                    changedIdColumn.isGenerated = true;
                    changedIdColumn.generationStrategy = "increment";
                    return [4 /*yield*/, queryRunner.changeColumn(table, idColumn, changedIdColumn)];
                case 9:
                    _a.sent();
                    return [4 /*yield*/, queryRunner.getTable("post")];
                case 10:
                    table = _a.sent();
                    table.findColumnByName("id").isGenerated.should.be.true;
                    table.findColumnByName("id").generationStrategy.should.be.equal("increment");
                    return [4 /*yield*/, queryRunner.executeMemoryDownSql()];
                case 11:
                    _a.sent();
                    queryRunner.clearSqlMemory();
                    return [4 /*yield*/, queryRunner.getTable("post")];
                case 12:
                    table = _a.sent();
                    table.findColumnByName("id").isGenerated.should.be.false;
                    chai_1.expect(table.findColumnByName("id").generationStrategy).to.be.undefined;
                    return [4 /*yield*/, queryRunner.release()];
                case 13:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=change-column.js.map