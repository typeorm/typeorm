"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var CockroachDriver_1 = require("../../../src/driver/cockroachdb/CockroachDriver");
var test_utils_1 = require("../../utils/test-utils");
var Table_1 = require("../../../src/schema-builder/table/Table");
var TableIndex_1 = require("../../../src/schema-builder/table/TableIndex");
describe("query runner > create index", function () {
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
    it("should correctly create index and revert creation", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var queryRunner, index, uniqueIndex, table;
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
                                },
                                {
                                    name: "description",
                                    type: "varchar",
                                }
                            ]
                        }), true)];
                case 1:
                    _a.sent();
                    // clear sqls in memory to avoid removing tables when down queries executed.
                    queryRunner.clearSqlMemory();
                    index = new TableIndex_1.TableIndex({ columnNames: ["name", "description"] });
                    return [4 /*yield*/, queryRunner.createIndex("question", index)];
                case 2:
                    _a.sent();
                    uniqueIndex = new TableIndex_1.TableIndex({ columnNames: ["description"], isUnique: true });
                    return [4 /*yield*/, queryRunner.createIndex("question", uniqueIndex)];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, queryRunner.getTable("question")];
                case 4:
                    table = _a.sent();
                    // CockroachDB stores unique indices as UNIQUE constraints
                    if (connection.driver instanceof CockroachDriver_1.CockroachDriver) {
                        table.indices.length.should.be.equal(1);
                        table.uniques.length.should.be.equal(1);
                    }
                    else {
                        table.indices.length.should.be.equal(2);
                    }
                    return [4 /*yield*/, queryRunner.executeMemoryDownSql()];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, queryRunner.getTable("question")];
                case 6:
                    table = _a.sent();
                    table.indices.length.should.be.equal(0);
                    table.uniques.length.should.be.equal(0);
                    return [4 /*yield*/, queryRunner.release()];
                case 7:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=create-index.js.map