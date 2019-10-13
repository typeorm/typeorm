"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../../utils/test-utils");
describe("migrations > show command", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
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
    it("can recognise pending migrations", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var migrations;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, connection.showMigrations()];
                case 1:
                    migrations = _a.sent();
                    migrations.should.be.equal(true);
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("can recognise no pending migrations", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var migrations;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, connection.runMigrations()];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, connection.showMigrations()];
                case 2:
                    migrations = _a.sent();
                    migrations.should.be.equal(false);
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=command.js.map