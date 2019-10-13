"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../../utils/test-utils");
var Customer_1 = require("./entity/Customer");
describe("indices > basic unique index test", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                    })];
                case 1: return [2 /*return*/, connections = _a.sent()];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    describe("unique index", function () {
        var _this = this;
        it("should work without errors", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var customer;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        customer = new Customer_1.Customer();
                        customer.nameEnglish = "Umed";
                        customer.nameHebrew = "Uma";
                        return [4 /*yield*/, connection.manager.save(customer)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); })); });
    });
});
//# sourceMappingURL=basic-unique-index-test.js.map