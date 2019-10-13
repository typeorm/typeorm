"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var EquipmentModel_1 = require("./entity/EquipmentModel");
var chai_1 = require("chai");
describe("github issues > #3587 do not generate change queries for number based enum types every time", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [EquipmentModel_1.EquipmentModel],
                        enabledDrivers: ["postgres"]
                    })];
                case 1: return [2 /*return*/, connections = _a.sent()];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should NOT generate change queries in case enum is not changed", function () { return Promise.all(connections.map(function (connection) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var sqlInMemory;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, connection.synchronize(true)];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, connection.driver.createSchemaBuilder().log()];
                    case 2:
                        sqlInMemory = _a.sent();
                        chai_1.expect(sqlInMemory.downQueries).to.be.eql([]);
                        chai_1.expect(sqlInMemory.upQueries).to.be.eql([]);
                        return [2 /*return*/];
                }
            });
        });
    })); });
});
//# sourceMappingURL=issue-3587.js.map