"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var chai_1 = require("chai");
var Record_1 = require("./entity/Record");
describe("github issues > #1314 UPDATE on json column stores string type", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                        enabledDrivers: ["postgres"] // because only postgres supports jsonb type
                    })];
                case 1: return [2 /*return*/, connections = _a.sent()];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should not store json type as string on update", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var recordRepo, record, persistedRecord, foundRecord;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    recordRepo = connection.getRepository(Record_1.Record);
                    record = new Record_1.Record();
                    record.data = { foo: "bar" };
                    return [4 /*yield*/, recordRepo.save(record)];
                case 1:
                    persistedRecord = _a.sent();
                    record.data.should.be.eql({ foo: "bar" });
                    return [4 /*yield*/, recordRepo.findOne(persistedRecord.id)];
                case 2:
                    foundRecord = _a.sent();
                    chai_1.expect(foundRecord).to.be.not.undefined;
                    chai_1.expect(foundRecord.data.foo).to.eq("bar");
                    // Update
                    foundRecord.data = { answer: 42 };
                    return [4 /*yield*/, recordRepo.save(foundRecord)];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, recordRepo.findOne(persistedRecord.id)];
                case 4:
                    foundRecord = _a.sent();
                    chai_1.expect(foundRecord).to.be.not.undefined;
                    chai_1.expect(foundRecord.data).to.not.be.equal("{\"answer\":42}");
                    chai_1.expect(foundRecord.data.answer).to.eq(42);
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-1314.js.map