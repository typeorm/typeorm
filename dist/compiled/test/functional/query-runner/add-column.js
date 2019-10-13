"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var chai_1 = require("chai");
var CockroachDriver_1 = require("../../../src/driver/cockroachdb/CockroachDriver");
var test_utils_1 = require("../../utils/test-utils");
var TableColumn_1 = require("../../../src/schema-builder/table/TableColumn");
var AbstractSqliteDriver_1 = require("../../../src/driver/sqlite-abstract/AbstractSqliteDriver");
var MysqlDriver_1 = require("../../../src/driver/mysql/MysqlDriver");
describe("query runner > add column", function () {
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
    it("should correctly add column and revert add", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var queryRunner, table, column1, column2;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    queryRunner = connection.createQueryRunner();
                    return [4 /*yield*/, queryRunner.getTable("post")];
                case 1:
                    table = _a.sent();
                    column1 = new TableColumn_1.TableColumn({
                        name: "secondId",
                        type: "int",
                        isUnique: true,
                        isNullable: false
                    });
                    // CockroachDB does not support altering primary key constraint
                    if (!(connection.driver instanceof CockroachDriver_1.CockroachDriver))
                        column1.isPrimary = true;
                    // MySql and Sqlite does not supports autoincrement composite primary keys.
                    if (!(connection.driver instanceof MysqlDriver_1.MysqlDriver) && !(connection.driver instanceof AbstractSqliteDriver_1.AbstractSqliteDriver) && !(connection.driver instanceof CockroachDriver_1.CockroachDriver)) {
                        column1.isGenerated = true;
                        column1.generationStrategy = "increment";
                    }
                    column2 = new TableColumn_1.TableColumn({
                        name: "description",
                        type: "varchar",
                        length: "100",
                        default: "'this is description'"
                    });
                    return [4 /*yield*/, queryRunner.addColumn(table, column1)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, queryRunner.addColumn("post", column2)];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, queryRunner.getTable("post")];
                case 4:
                    table = _a.sent();
                    column1 = table.findColumnByName("secondId");
                    column1.should.be.exist;
                    column1.isUnique.should.be.true;
                    column1.isNullable.should.be.false;
                    // CockroachDB does not support altering primary key constraint
                    if (!(connection.driver instanceof CockroachDriver_1.CockroachDriver))
                        column1.isPrimary.should.be.true;
                    // MySql and Sqlite does not supports autoincrement composite primary keys.
                    if (!(connection.driver instanceof MysqlDriver_1.MysqlDriver) && !(connection.driver instanceof AbstractSqliteDriver_1.AbstractSqliteDriver) && !(connection.driver instanceof CockroachDriver_1.CockroachDriver)) {
                        column1.isGenerated.should.be.true;
                        column1.generationStrategy.should.be.equal("increment");
                    }
                    column2 = table.findColumnByName("description");
                    column2.should.be.exist;
                    column2.length.should.be.equal("100");
                    column2.default.should.be.equal("'this is description'");
                    return [4 /*yield*/, queryRunner.executeMemoryDownSql()];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, queryRunner.getTable("post")];
                case 6:
                    table = _a.sent();
                    chai_1.expect(table.findColumnByName("secondId")).to.be.undefined;
                    chai_1.expect(table.findColumnByName("description")).to.be.undefined;
                    return [4 /*yield*/, queryRunner.release()];
                case 7:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=add-column.js.map