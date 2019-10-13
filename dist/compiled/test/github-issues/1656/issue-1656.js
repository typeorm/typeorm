"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var chai_1 = require("chai");
var Controller_1 = require("./controller/Controller");
var A_1 = require("./entity/A");
var B_1 = require("./entity/B");
var C_1 = require("./entity/C");
describe("github issues > #1656 Wrong repository order with multiple TransactionRepository inside a Transaction decorator", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                        enabledDrivers: ["mysql"],
                        schemaCreate: true,
                        dropSchema: true,
                    })];
                case 1: return [2 /*return*/, connections = _a.sent()];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should set TransactionRepository arguments in order", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var _a, a, b, c;
        return tslib_1.__generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, new Controller_1.Controller().t(new A_1.A(), new B_1.B(), new C_1.C())];
                case 1:
                    _a = tslib_1.__read.apply(void 0, [_b.sent(), 3]), a = _a[0], b = _a[1], c = _a[2];
                    chai_1.expect(a).to.be.eq("a");
                    chai_1.expect(b).to.be.eq("b");
                    chai_1.expect(c).to.be.eq("c");
                    return [2 /*return*/];
            }
        });
    }); })); });
    // you can add additional tests if needed
});
//# sourceMappingURL=issue-1656.js.map