"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var src_1 = require("../../../src");
describe("github issues > #1863 createTable.uniques doesn't work when the columnNames only has one item", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        enabledDrivers: ["mysql"],
                        dropSchema: true,
                    })];
                case 1:
                    connections = _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should correctly create table with unique constraint", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var queryRunner, table;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    queryRunner = connection.createQueryRunner();
                    return [4 /*yield*/, queryRunner.createTable(new src_1.Table({
                            name: "post",
                            columns: [
                                {
                                    name: "id",
                                    type: "int",
                                    isPrimary: true
                                },
                                {
                                    name: "name",
                                    type: "varchar",
                                    isNullable: false
                                }
                            ],
                            uniques: [
                                {
                                    name: "table_unique",
                                    columnNames: ["name"]
                                }
                            ]
                        }))];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, queryRunner.getTable("post")];
                case 2:
                    table = _a.sent();
                    table.indices.length.should.be.equal(1);
                    table.indices[0].name.should.be.equal("table_unique");
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-1863.js.map