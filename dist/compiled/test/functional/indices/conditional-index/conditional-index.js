"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../../utils/test-utils");
var chai_1 = require("chai");
describe("indices > conditional index", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                        enabledDrivers: ["mssql", "postgres", "sqlite"],
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
    it("should correctly create conditional indices with WHERE condition", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var queryRunner, table;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    queryRunner = connection.createQueryRunner();
                    return [4 /*yield*/, queryRunner.getTable("post")];
                case 1:
                    table = _a.sent();
                    table.indices.length.should.be.equal(2);
                    chai_1.expect(table.indices[0].where).to.be.not.empty;
                    chai_1.expect(table.indices[1].where).to.be.not.empty;
                    return [4 /*yield*/, queryRunner.release()];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should correctly drop conditional indices and revert drop", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var queryRunner, table;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    queryRunner = connection.createQueryRunner();
                    return [4 /*yield*/, queryRunner.getTable("post")];
                case 1:
                    table = _a.sent();
                    table.indices.length.should.be.equal(2);
                    chai_1.expect(table.indices[0].where).to.be.not.empty;
                    chai_1.expect(table.indices[1].where).to.be.not.empty;
                    return [4 /*yield*/, queryRunner.dropIndices(table, table.indices)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, queryRunner.getTable("post")];
                case 3:
                    table = _a.sent();
                    table.indices.length.should.be.equal(0);
                    return [4 /*yield*/, queryRunner.executeMemoryDownSql()];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, queryRunner.getTable("post")];
                case 5:
                    table = _a.sent();
                    table.indices.length.should.be.equal(2);
                    chai_1.expect(table.indices[0].where).to.be.not.empty;
                    chai_1.expect(table.indices[1].where).to.be.not.empty;
                    return [4 /*yield*/, queryRunner.release()];
                case 6:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=conditional-index.js.map