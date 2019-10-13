"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var chai_1 = require("chai");
var dummy_1 = require("./entity/dummy");
var transformer_1 = require("./transformer");
describe("github issues > #2557 object looses its prototype before transformer.to()", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                        schemaCreate: true,
                        dropSchema: true,
                    })];
                case 1: return [2 /*return*/, connections = _a.sent()];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should give correct object in transformer.to", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var dummy;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    dummy = new dummy_1.Dummy();
                    dummy.id = 1;
                    dummy.num = new transformer_1.WrappedNumber(3);
                    return [4 /*yield*/, connection.getRepository(dummy_1.Dummy).save(dummy)];
                case 1:
                    _a.sent();
                    chai_1.expect(transformer_1.transformer.lastValue).to.be.instanceOf(transformer_1.WrappedNumber);
                    return [2 /*return*/];
            }
        });
    }); })); });
    // you can add additional tests if needed
});
//# sourceMappingURL=issue-2557.js.map