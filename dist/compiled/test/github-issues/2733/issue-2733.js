"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var chai_1 = require("chai");
describe("github issues > #2733 should correctly handle function calls with upercase letters as default values", function () {
    var connections;
    it("MSSQL, Sqljs, Sqlite", function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var _this = this;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/MSSQLDummy{.js,.ts}"],
                        schemaCreate: true,
                        dropSchema: true,
                        enabledDrivers: ["mssql", "sqljs", "sqlite"],
                    })];
                case 1:
                    connections = _a.sent();
                    return [4 /*yield*/, test_utils_1.reloadTestingDatabases(connections)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                            var schemaBuilder, syncQueries;
                            return tslib_1.__generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        schemaBuilder = connection.driver.createSchemaBuilder();
                                        return [4 /*yield*/, schemaBuilder.log()];
                                    case 1:
                                        syncQueries = _a.sent();
                                        chai_1.expect(syncQueries.downQueries).to.be.eql([]);
                                        chai_1.expect(syncQueries.upQueries).to.be.eql([]);
                                        return [2 /*return*/];
                                }
                            });
                        }); }))];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, test_utils_1.closeTestingConnections(connections)];
                case 4:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it("Postgres", function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var _this = this;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/PostgresDummy{.js,.ts}"],
                        schemaCreate: true,
                        dropSchema: true,
                        enabledDrivers: ["postgres"],
                    })];
                case 1:
                    connections = _a.sent();
                    return [4 /*yield*/, test_utils_1.reloadTestingDatabases(connections)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                            var schemaBuilder, syncQueries;
                            return tslib_1.__generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        schemaBuilder = connection.driver.createSchemaBuilder();
                                        return [4 /*yield*/, schemaBuilder.log()];
                                    case 1:
                                        syncQueries = _a.sent();
                                        chai_1.expect(syncQueries.downQueries).to.be.eql([]);
                                        chai_1.expect(syncQueries.upQueries).to.be.eql([]);
                                        return [2 /*return*/];
                                }
                            });
                        }); }))];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, test_utils_1.closeTestingConnections(connections)];
                case 4:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
});
//# sourceMappingURL=issue-2733.js.map