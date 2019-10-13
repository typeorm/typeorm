"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var Booking_1 = require("./entity/Booking");
var NamingStrategyUnderTest_1 = require("./naming/NamingStrategyUnderTest");
describe("github issue > #2200 Bug - Issue with snake_case naming strategy", function () {
    var connections;
    var namingStrategy = new NamingStrategyUnderTest_1.NamingStrategyUnderTest();
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                        namingStrategy: namingStrategy
                    })];
                case 1: return [2 /*return*/, connections = _a.sent()];
            }
        });
    }); });
    beforeEach(function () {
        return test_utils_1.reloadTestingDatabases(connections);
    });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("Renammed alias allow to query correctly", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, connection.getRepository(Booking_1.Booking).find({ take: 10 })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-2200.js.map