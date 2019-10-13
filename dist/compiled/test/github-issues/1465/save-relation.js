"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var chai_1 = require("chai");
var test_utils_1 = require("../../utils/test-utils");
var Account_1 = require("./entity/Account");
var AccountActivationToken_1 = require("./entity/AccountActivationToken");
describe("save child and parent entity", function () {
    var connections = [];
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                        enabledDrivers: ["mysql", "mariadb", "sqlite", "sqljs"]
                    })];
                case 1: return [2 /*return*/, connections = _a.sent()];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("account property in accountActivationToken should not be null", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var account, savedAccount;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    account = new Account_1.Account();
                    account.username = "test";
                    account.password = "123456";
                    account.accountActivationToken = new AccountActivationToken_1.AccountActivationToken("XXXXXXXXXXXXXXXXXX", new Date());
                    return [4 /*yield*/, connection.manager.save(account)];
                case 1:
                    savedAccount = _a.sent();
                    chai_1.assert.isNotNull(savedAccount.accountActivationToken.account);
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=save-relation.js.map