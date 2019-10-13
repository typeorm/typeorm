"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var chai_1 = require("chai");
var Record_1 = require("./entity/Record");
var test_utils_1 = require("../../utils/test-utils");
var RecordData_1 = require("./entity/RecordData");
describe("github issues > #204 jsonb array is not persisted correctly", function () {
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
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should persist json and jsonb arrays correctly", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var record, foundRecord;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    record = new Record_1.Record();
                    record.datas = [
                        new RecordData_1.RecordData("hello1", "hello2", "hello3", "hello4", true, false),
                        new RecordData_1.RecordData("hi1", "hi2", "hi3", "hi4", false, true),
                        new RecordData_1.RecordData("bye1", "bye2", "bye3", "bye4", false, false),
                    ];
                    record.configs = [
                        { id: 1, option1: "1", option2: "1", option3: "1", isActive: true, extra: { data1: "one", data2: "two" } },
                        { id: 2, option1: "2", option2: "2", option3: "2", isActive: false, extra: { data1: "one", data2: "two" } },
                        { id: 3, option1: "3", option2: "3", option3: "3", isActive: true, extra: { data1: "one", data2: "two" } },
                    ];
                    return [4 /*yield*/, connection.manager.save(record)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, connection.manager.findOne(Record_1.Record, record.id)];
                case 2:
                    foundRecord = _a.sent();
                    chai_1.expect(foundRecord).to.be.not.undefined;
                    foundRecord.datas.should.be.eql([
                        new RecordData_1.RecordData("hello1", "hello2", "hello3", "hello4", true, false),
                        new RecordData_1.RecordData("hi1", "hi2", "hi3", "hi4", false, true),
                        new RecordData_1.RecordData("bye1", "bye2", "bye3", "bye4", false, false),
                    ]);
                    foundRecord.configs.should.be.eql([
                        { id: 1, option1: "1", option2: "1", option3: "1", isActive: true, extra: { data1: "one", data2: "two" } },
                        { id: 2, option1: "2", option2: "2", option3: "2", isActive: false, extra: { data1: "one", data2: "two" } },
                        { id: 3, option1: "3", option2: "3", option3: "3", isActive: true, extra: { data1: "one", data2: "two" } },
                    ]);
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-204.js.map