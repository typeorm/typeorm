"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var CockroachDriver_1 = require("../../../src/driver/cockroachdb/CockroachDriver");
var test_utils_1 = require("../../utils/test-utils");
var Category_1 = require("./entity/Category");
var Question_1 = require("./entity/Question");
var AbstractSqliteDriver_1 = require("../../../src/driver/sqlite-abstract/AbstractSqliteDriver");
describe("schema builder > update primary keys", function () {
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
    it("should correctly update composite primary keys", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var metadata, nameColumn, queryRunner, table;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    // CockroachDB does not support changing primary key constraint
                    if (connection.driver instanceof CockroachDriver_1.CockroachDriver)
                        return [2 /*return*/];
                    metadata = connection.getMetadata(Category_1.Category);
                    nameColumn = metadata.findColumnWithPropertyName("name");
                    nameColumn.isPrimary = true;
                    return [4 /*yield*/, connection.synchronize()];
                case 1:
                    _a.sent();
                    queryRunner = connection.createQueryRunner();
                    return [4 /*yield*/, queryRunner.getTable("category")];
                case 2:
                    table = _a.sent();
                    table.findColumnByName("id").isPrimary.should.be.true;
                    table.findColumnByName("name").isPrimary.should.be.true;
                    return [4 /*yield*/, queryRunner.release()];
                case 3:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should correctly update composite primary keys when table already have primary generated column", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var metadata, nameColumn, queryRunner, table;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    // Sqlite does not support AUTOINCREMENT on composite primary key
                    if (connection.driver instanceof AbstractSqliteDriver_1.AbstractSqliteDriver)
                        return [2 /*return*/];
                    // CockroachDB does not support changing primary key constraint
                    if (connection.driver instanceof CockroachDriver_1.CockroachDriver)
                        return [2 /*return*/];
                    metadata = connection.getMetadata(Question_1.Question);
                    nameColumn = metadata.findColumnWithPropertyName("name");
                    nameColumn.isPrimary = true;
                    return [4 /*yield*/, connection.synchronize()];
                case 1:
                    _a.sent();
                    queryRunner = connection.createQueryRunner();
                    return [4 /*yield*/, queryRunner.getTable("question")];
                case 2:
                    table = _a.sent();
                    table.findColumnByName("id").isPrimary.should.be.true;
                    table.findColumnByName("name").isPrimary.should.be.true;
                    return [4 /*yield*/, queryRunner.release()];
                case 3:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=update-primary-keys.js.map