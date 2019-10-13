"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
describe("github issues > #2875 runMigrations() function is not returning a list of migrated files", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                        migrations: [__dirname + "/migration/*.js"],
                        enabledDrivers: ["postgres"],
                        schemaCreate: true,
                        dropSchema: true,
                    })];
                case 1: return [2 /*return*/, connections = _a.sent()];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should be able to run all necessary migrations", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var mymigr;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, connection.runMigrations()];
                case 1:
                    mymigr = _a.sent();
                    mymigr.length.should.be.equal(1);
                    mymigr[0].name.should.be.equal("InitUsers1530542855524");
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-2875.js.map