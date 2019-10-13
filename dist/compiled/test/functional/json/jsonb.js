"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var chai_1 = require("chai");
var Record_1 = require("./entity/Record");
var test_utils_1 = require("../../utils/test-utils");
describe("jsonb type", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [Record_1.Record],
                        enabledDrivers: ["postgres"] // because only postgres supports jsonb type
                    })];
                case 1: return [2 /*return*/, connections = _a.sent()];
            }
        });
    }); });
    // beforeEach(() => reloadTestingDatabases(connections));
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should make correct schema with Postgres' jsonb type", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var queryRunner, schema;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, connection.synchronize(true)];
                case 1:
                    _a.sent();
                    queryRunner = connection.createQueryRunner();
                    return [4 /*yield*/, queryRunner.getTable("record")];
                case 2:
                    schema = _a.sent();
                    return [4 /*yield*/, queryRunner.release()];
                case 3:
                    _a.sent();
                    chai_1.expect(schema).not.to.be.undefined;
                    chai_1.expect(schema.columns.find(function (tableColumn) { return tableColumn.name === "config" && tableColumn.type === "json"; })).to.be.not.empty;
                    chai_1.expect(schema.columns.find(function (tableColumn) { return tableColumn.name === "data" && tableColumn.type === "jsonb"; })).to.be.not.empty;
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should persist jsonb correctly", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var recordRepo, record, persistedRecord, foundRecord;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, connection.synchronize(true)];
                case 1:
                    _a.sent();
                    recordRepo = connection.getRepository(Record_1.Record);
                    record = new Record_1.Record();
                    record.data = { foo: "bar" };
                    return [4 /*yield*/, recordRepo.save(record)];
                case 2:
                    persistedRecord = _a.sent();
                    return [4 /*yield*/, recordRepo.findOne(persistedRecord.id)];
                case 3:
                    foundRecord = _a.sent();
                    chai_1.expect(foundRecord).to.be.not.undefined;
                    chai_1.expect(foundRecord.data.foo).to.eq("bar");
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should persist jsonb string correctly", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var recordRepo, record, persistedRecord, foundRecord;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    recordRepo = connection.getRepository(Record_1.Record);
                    record = new Record_1.Record();
                    record.data = "foo";
                    return [4 /*yield*/, recordRepo.save(record)];
                case 1:
                    persistedRecord = _a.sent();
                    return [4 /*yield*/, recordRepo.findOne(persistedRecord.id)];
                case 2:
                    foundRecord = _a.sent();
                    chai_1.expect(foundRecord).to.be.not.undefined;
                    chai_1.expect(foundRecord.data).to.be.a("string");
                    chai_1.expect(foundRecord.data).to.eq("foo");
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should persist jsonb array correctly", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var recordRepo, record, persistedRecord, foundRecord;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    recordRepo = connection.getRepository(Record_1.Record);
                    record = new Record_1.Record();
                    record.data = [1, "2", { a: 3 }];
                    return [4 /*yield*/, recordRepo.save(record)];
                case 1:
                    persistedRecord = _a.sent();
                    return [4 /*yield*/, recordRepo.findOne(persistedRecord.id)];
                case 2:
                    foundRecord = _a.sent();
                    chai_1.expect(foundRecord).to.be.not.undefined;
                    chai_1.expect(foundRecord.data).to.deep.include.members([1, "2", { a: 3 }]);
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=jsonb.js.map