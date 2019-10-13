"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var PostgresDriver_1 = require("../../../src/driver/postgres/PostgresDriver");
var User_1 = require("./entity/User");
var chai_1 = require("chai");
describe("github issues > #2067 Unhandled promise rejection warning on postgres connection issues", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        enabledDrivers: ["postgres"],
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
    it("should return a catchable error on connection errors in queries", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var connectionFailureMessage, repository;
        return tslib_1.__generator(this, function (_a) {
            connectionFailureMessage = "Test error to simulate a connection error";
            if (connection.driver instanceof PostgresDriver_1.PostgresDriver) {
                connection.driver.obtainMasterConnection = function () { return Promise.reject(new Error(connectionFailureMessage)); };
                connection.driver.obtainSlaveConnection = function () { return Promise.reject(new Error(connectionFailureMessage)); };
            }
            repository = connection.getRepository(User_1.User);
            return [2 /*return*/, chai_1.expect(repository.find()).to.be.rejectedWith(Error, connectionFailureMessage)];
        });
    }); })); });
});
//# sourceMappingURL=issue-2067.js.map