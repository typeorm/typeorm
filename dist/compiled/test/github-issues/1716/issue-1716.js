"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var chai_1 = require("chai");
var pgEntity_1 = require("./entity/pgEntity");
var mysqlEntity_1 = require("./entity/mysqlEntity");
var mariadbEntity_1 = require("./entity/mariadbEntity");
var mssqlEntity_1 = require("./entity/mssqlEntity");
var toISOString = function (input) { return new Date(input).toISOString(); };
var convertPropsToISOStrings = function (obj, props) {
    props.map(function (prop) {
        obj[prop] = toISOString(obj[prop]);
    });
};
var isDriverEnabled = function (driver) {
    var ormConfigConnectionOptionsArray = test_utils_1.getTypeOrmConfig();
    var config = ormConfigConnectionOptionsArray.find(function (options) { return options.name === driver; });
    return config && !config.skip;
};
describe("github issues > #1716 send timestamp to database without converting it into UTC", function () {
    describe("postgres", function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var connections;
        var _this = this;
        return tslib_1.__generator(this, function (_a) {
            if (!isDriverEnabled("postgres")) {
                return [2 /*return*/];
            }
            before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                return tslib_1.__generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                                entities: [pgEntity_1.PgEntity],
                                schemaCreate: true,
                                dropSchema: true,
                                enabledDrivers: [
                                    "postgres"
                                ]
                            })];
                        case 1:
                            connections = _a.sent();
                            return [2 /*return*/];
                    }
                });
            }); });
            beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
            after(function () { return test_utils_1.closeTestingConnections(connections); });
            it("should persist dates and times correctly", function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                var manager, result1, result2;
                return tslib_1.__generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            manager = connections[0].manager;
                            return [4 /*yield*/, manager.save(pgEntity_1.PgEntity, {
                                    id: 1,
                                    fieldTime: "14:00:00+05",
                                    fieldTimeWithTZ: "14:00:00+05",
                                    fieldTimeWithoutTZ: "14:00:00+05",
                                    fieldTimestamp: "2018-03-07 14:00:00+05",
                                    fieldTimestampWithoutTZ: "2018-03-07 14:00:00+05",
                                    fieldTimestampWithTZ: "2018-03-07 14:00:00+05",
                                })];
                        case 1:
                            _a.sent();
                            return [4 /*yield*/, manager.findOne(pgEntity_1.PgEntity, 1)];
                        case 2:
                            result1 = _a.sent();
                            convertPropsToISOStrings(result1, ["fieldTimestamp", "fieldTimestampWithoutTZ", "fieldTimestampWithTZ"]);
                            chai_1.expect(result1).to.deep.equal({
                                id: 1,
                                fieldTime: "14:00:00",
                                fieldTimeWithTZ: "14:00:00+05",
                                fieldTimeWithoutTZ: "14:00:00",
                                fieldTimestamp: toISOString("2018-03-07 14:00:00+05"),
                                fieldTimestampWithoutTZ: toISOString("2018-03-07 14:00:00+05"),
                                fieldTimestampWithTZ: toISOString("2018-03-07 14:00:00+05"),
                            });
                            return [4 /*yield*/, manager.save(pgEntity_1.PgEntity, {
                                    id: 2,
                                    fieldTime: "17:00:00",
                                    fieldTimeWithTZ: "17:00:00",
                                    fieldTimeWithoutTZ: "17:00:00",
                                    fieldTimestamp: "2018-03-07 17:00:00",
                                    fieldTimestampWithoutTZ: "2018-03-07 17:00:00",
                                    fieldTimestampWithTZ: "2018-03-07 17:00:00",
                                })];
                        case 3:
                            _a.sent();
                            return [4 /*yield*/, manager.findOne(pgEntity_1.PgEntity, 2)];
                        case 4:
                            result2 = _a.sent();
                            convertPropsToISOStrings(result2, ["fieldTimestamp", "fieldTimestampWithoutTZ", "fieldTimestampWithTZ"]);
                            chai_1.expect(result2).to.deep.equal({
                                id: 2,
                                fieldTime: "17:00:00",
                                fieldTimeWithTZ: "17:00:00+00",
                                fieldTimeWithoutTZ: "17:00:00",
                                fieldTimestamp: toISOString("2018-03-07 17:00:00"),
                                fieldTimestampWithoutTZ: toISOString("2018-03-07 17:00:00"),
                                fieldTimestampWithTZ: toISOString("2018-03-07 17:00:00"),
                            });
                            return [2 /*return*/];
                    }
                });
            }); });
            return [2 /*return*/];
        });
    }); });
    describe("mysql", function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var connections;
        var _this = this;
        return tslib_1.__generator(this, function (_a) {
            if (!isDriverEnabled("mysql")) {
                return [2 /*return*/];
            }
            before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                return tslib_1.__generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                                entities: [mysqlEntity_1.MysqlEntity],
                                schemaCreate: true,
                                dropSchema: true,
                                enabledDrivers: [
                                    "mysql"
                                ]
                            })];
                        case 1:
                            connections = _a.sent();
                            return [2 /*return*/];
                    }
                });
            }); });
            beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
            after(function () { return test_utils_1.closeTestingConnections(connections); });
            it("should persist dates and times correctly", function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                var manager, result1, result2;
                return tslib_1.__generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            manager = connections[0].manager;
                            return [4 /*yield*/, manager.save(mysqlEntity_1.MysqlEntity, {
                                    id: 1,
                                    fieldTime: "14:00:00",
                                    fieldTimestamp: "2018-03-07 14:00:00+05",
                                    fieldDatetime: "2018-03-07 14:00:00+05",
                                })];
                        case 1:
                            _a.sent();
                            return [4 /*yield*/, manager.findOne(mysqlEntity_1.MysqlEntity, 1)];
                        case 2:
                            result1 = _a.sent();
                            convertPropsToISOStrings(result1, ["fieldTimestamp", "fieldDatetime"]);
                            chai_1.expect(result1).to.deep.equal({
                                id: 1,
                                fieldTime: "14:00:00",
                                fieldTimestamp: toISOString("2018-03-07 14:00:00+05"),
                                fieldDatetime: toISOString("2018-03-07 14:00:00+05"),
                            });
                            return [4 /*yield*/, manager.save(mysqlEntity_1.MysqlEntity, {
                                    id: 2,
                                    fieldTime: "17:00:00",
                                    fieldTimestamp: "2018-03-07 17:00:00",
                                    fieldDatetime: "2018-03-07 17:00:00",
                                })];
                        case 3:
                            _a.sent();
                            return [4 /*yield*/, manager.findOne(mysqlEntity_1.MysqlEntity, 2)];
                        case 4:
                            result2 = _a.sent();
                            convertPropsToISOStrings(result2, ["fieldTimestamp", "fieldDatetime"]);
                            chai_1.expect(result2).to.deep.equal({
                                id: 2,
                                fieldTime: "17:00:00",
                                fieldTimestamp: toISOString("2018-03-07 17:00:00"),
                                fieldDatetime: toISOString("2018-03-07 17:00:00"),
                            });
                            return [2 /*return*/];
                    }
                });
            }); });
            return [2 /*return*/];
        });
    }); });
    describe("mariadb", function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var connections;
        var _this = this;
        return tslib_1.__generator(this, function (_a) {
            if (!isDriverEnabled("mariadb")) {
                return [2 /*return*/];
            }
            before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                return tslib_1.__generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                                entities: [mariadbEntity_1.MariadbEntity],
                                schemaCreate: true,
                                dropSchema: true,
                                enabledDrivers: [
                                    "mariadb"
                                ]
                            })];
                        case 1:
                            connections = _a.sent();
                            return [2 /*return*/];
                    }
                });
            }); });
            beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
            after(function () { return test_utils_1.closeTestingConnections(connections); });
            it("should persist dates and times correctly", function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                var manager, result1, result2;
                return tslib_1.__generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            manager = connections[0].manager;
                            return [4 /*yield*/, manager.save(mariadbEntity_1.MariadbEntity, {
                                    id: 1,
                                    fieldTime: "14:00:00",
                                    fieldTimestamp: "2018-03-07 14:00:00+05",
                                    fieldDatetime: "2018-03-07 14:00:00+05",
                                })];
                        case 1:
                            _a.sent();
                            return [4 /*yield*/, manager.findOne(mariadbEntity_1.MariadbEntity, 1)];
                        case 2:
                            result1 = _a.sent();
                            convertPropsToISOStrings(result1, ["fieldTimestamp", "fieldDatetime"]);
                            chai_1.expect(result1).to.deep.equal({
                                id: 1,
                                fieldTime: "14:00:00",
                                fieldTimestamp: toISOString("2018-03-07 14:00:00+05"),
                                fieldDatetime: toISOString("2018-03-07 14:00:00+05"),
                            });
                            return [4 /*yield*/, manager.save(mariadbEntity_1.MariadbEntity, {
                                    id: 2,
                                    fieldTime: "17:00:00",
                                    fieldTimestamp: "2018-03-07 17:00:00",
                                    fieldDatetime: "2018-03-07 17:00:00",
                                })];
                        case 3:
                            _a.sent();
                            return [4 /*yield*/, manager.findOne(mariadbEntity_1.MariadbEntity, 2)];
                        case 4:
                            result2 = _a.sent();
                            convertPropsToISOStrings(result2, ["fieldTimestamp", "fieldDatetime"]);
                            chai_1.expect(result2).to.deep.equal({
                                id: 2,
                                fieldTime: "17:00:00",
                                fieldTimestamp: toISOString("2018-03-07 17:00:00"),
                                fieldDatetime: toISOString("2018-03-07 17:00:00"),
                            });
                            return [2 /*return*/];
                    }
                });
            }); });
            return [2 /*return*/];
        });
    }); });
    describe("mssql", function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var connections;
        var _this = this;
        return tslib_1.__generator(this, function (_a) {
            if (!isDriverEnabled("mssql")) {
                return [2 /*return*/];
            }
            before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                return tslib_1.__generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                                entities: [mssqlEntity_1.MssqlEntity],
                                schemaCreate: true,
                                dropSchema: true,
                                enabledDrivers: [
                                    "mssql"
                                ]
                            })];
                        case 1:
                            connections = _a.sent();
                            return [2 /*return*/];
                    }
                });
            }); });
            beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
            after(function () { return test_utils_1.closeTestingConnections(connections); });
            it("should persist dates and times correctly", function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                var manager, result1, result2;
                return tslib_1.__generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            manager = connections[0].manager;
                            return [4 /*yield*/, manager.save(mssqlEntity_1.MssqlEntity, {
                                    id: 1,
                                    fieldTime: "14:00:00",
                                    fieldDatetime: "2018-03-07 14:00:00+05",
                                    fieldDatetime2: "2018-03-07 14:00:00+05",
                                    fieldDatetimeoffset: "2018-03-07 14:00:00+05",
                                })];
                        case 1:
                            _a.sent();
                            return [4 /*yield*/, manager.findOne(mssqlEntity_1.MssqlEntity, 1)];
                        case 2:
                            result1 = _a.sent();
                            convertPropsToISOStrings(result1, ["fieldDatetime", "fieldDatetime2", "fieldDatetimeoffset"]);
                            chai_1.expect(result1).to.deep.equal({
                                id: 1,
                                fieldTime: "14:00:00",
                                fieldDatetime: toISOString("2018-03-07 14:00:00+05"),
                                fieldDatetime2: toISOString("2018-03-07 14:00:00+05"),
                                fieldDatetimeoffset: toISOString("2018-03-07 14:00:00+05"),
                            });
                            return [4 /*yield*/, manager.save(mssqlEntity_1.MssqlEntity, {
                                    id: 2,
                                    fieldTime: "17:00:00",
                                    fieldDatetime: "2018-03-07 17:00:00",
                                    fieldDatetime2: "2018-03-07 17:00:00",
                                    fieldDatetimeoffset: "2018-03-07 17:00:00",
                                })];
                        case 3:
                            _a.sent();
                            return [4 /*yield*/, manager.findOne(mssqlEntity_1.MssqlEntity, 2)];
                        case 4:
                            result2 = _a.sent();
                            convertPropsToISOStrings(result2, ["fieldDatetime", "fieldDatetime2", "fieldDatetimeoffset"]);
                            chai_1.expect(result2).to.deep.equal({
                                id: 2,
                                fieldTime: "17:00:00",
                                fieldDatetime: toISOString("2018-03-07 17:00:00"),
                                fieldDatetime2: toISOString("2018-03-07 17:00:00"),
                                fieldDatetimeoffset: toISOString("2018-03-07 17:00:00"),
                            });
                            return [2 /*return*/];
                    }
                });
            }); });
            return [2 /*return*/];
        });
    }); });
});
//# sourceMappingURL=issue-1716.js.map