"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var Account_1 = require("./entity/Account");
var src_1 = require("../../../src");
describe("github issues > #1805 bigint PK incorrectly returning as a number (expecting a string)", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                        enabledDrivers: ["mysql"],
                        schemaCreate: true,
                        dropSchema: true
                    })];
                case 1:
                    connections = _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should return `bigint` column as string", function () { return src_1.PromiseUtils.runInSequence(connections, function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var account, bigIntId;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    Account_1.Account.useConnection(connection);
                    bigIntId = "76561198016705746";
                    account = new Account_1.Account();
                    account.id = bigIntId;
                    return [4 /*yield*/, account.save()];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, Account_1.Account.findOne(bigIntId)];
                case 2:
                    account = _a.sent();
                    account.id.should.be.equal(bigIntId);
                    return [2 /*return*/];
            }
        });
    }); }); });
});
//# sourceMappingURL=issue-1805.js.map