"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var MysqlDriver_1 = require("../../../src/driver/mysql/MysqlDriver");
var PostgresDriver_1 = require("../../../src/driver/postgres/PostgresDriver");
var AbstractSqliteDriver_1 = require("../../../src/driver/sqlite-abstract/AbstractSqliteDriver");
var SqlServerDriver_1 = require("../../../src/driver/sqlserver/SqlServerDriver");
var test_utils_1 = require("../../utils/test-utils");
var src_1 = require("../../../src");
describe("github issues > #3379 Migration will keep create and drop indexes if index name is the same across tables", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"]
                    })];
                case 1: return [2 /*return*/, connections = _a.sent()];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should not recreate indices", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var queryRunner, postTableName, sqlInMemory;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    queryRunner = connection.createQueryRunner();
                    postTableName = "post";
                    if (!(connection.driver instanceof SqlServerDriver_1.SqlServerDriver)) return [3 /*break*/, 3];
                    postTableName = "testDB.testSchema.post";
                    return [4 /*yield*/, queryRunner.createDatabase("testDB", true)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, queryRunner.createSchema("testDB.testSchema", true)];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 7];
                case 3:
                    if (!(connection.driver instanceof PostgresDriver_1.PostgresDriver)) return [3 /*break*/, 5];
                    postTableName = "testSchema.post";
                    return [4 /*yield*/, queryRunner.createSchema("testSchema", true)];
                case 4:
                    _a.sent();
                    return [3 /*break*/, 7];
                case 5:
                    if (!(connection.driver instanceof MysqlDriver_1.MysqlDriver)) return [3 /*break*/, 7];
                    postTableName = "testDB.post";
                    return [4 /*yield*/, queryRunner.createDatabase("testDB", true)];
                case 6:
                    _a.sent();
                    _a.label = 7;
                case 7: return [4 /*yield*/, queryRunner.createTable(new src_1.Table({
                        name: postTableName,
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
                        indices: [{ name: "name_index", columnNames: ["name"] }]
                    }), true)];
                case 8:
                    _a.sent();
                    if (!(connection.driver instanceof MysqlDriver_1.MysqlDriver || connection.driver instanceof SqlServerDriver_1.SqlServerDriver)) return [3 /*break*/, 10];
                    return [4 /*yield*/, queryRunner.createTable(new src_1.Table({
                            name: "category",
                            columns: [
                                {
                                    name: "id",
                                    type: "int",
                                    isPrimary: true,
                                    isGenerated: true,
                                    generationStrategy: "increment"
                                },
                                {
                                    name: "name",
                                    type: "varchar",
                                }
                            ],
                            indices: [{ name: "name_index", columnNames: ["name"] }]
                        }), true)];
                case 9:
                    _a.sent();
                    _a.label = 10;
                case 10: return [4 /*yield*/, queryRunner.release()];
                case 11:
                    _a.sent();
                    return [4 /*yield*/, connection.driver.createSchemaBuilder().log()];
                case 12:
                    sqlInMemory = _a.sent();
                    sqlInMemory.upQueries.length.should.be.equal(0);
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-3379.js.map