"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
// TODO: https://dev.mysql.com/doc/refman/8.0/en/server-system-variables.html#sysvar_explicit_defaults_for_timestamp
describe.skip("github issues > #1960 Migration generator produces duplicated changes", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                        enabledDrivers: ["mysql"],
                        logging: true
                    })];
                case 1: return [2 /*return*/, connections = _a.sent()];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should not execute any alter queries", function () { return Promise.all(connections.map(function (connection) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var sqlInMemory;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, connection.driver.createSchemaBuilder().log()];
                    case 1:
                        sqlInMemory = _a.sent();
                        sqlInMemory.upQueries.length.should.be.equal(0);
                        return [2 /*return*/];
                }
            });
        });
    })); });
});
//# sourceMappingURL=issue-1960.js.map