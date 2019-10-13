"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var Flight_1 = require("./entity/Flight");
var PostgresDriver_1 = require("../../../src/driver/postgres/PostgresDriver");
var chai_1 = require("chai");
describe.skip("github issues > #838 Time zones for timestamp columns are incorrectly fetched and persisted in PostgreSQL", function () {
    var connections;
    var postgresConnection;
    var testDateString = "1989-08-16T10:00:00+03:00";
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                        enabledDrivers: [
                            "postgres"
                        ]
                    })];
                case 1:
                    connections = _a.sent();
                    postgresConnection = connections.find(function (connection) { return connection.driver instanceof PostgresDriver_1.PostgresDriver; });
                    return [2 /*return*/];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should return date & time stored in PostgreSQL database correctly", function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var flight;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: 
                // await postgresConnection.query(`INSERT INTO "flight" ("id", "date") VALUES (1, '1989-08-16 14:00:00.000000 +03:00');`);
                // const results = await postgresConnection.query(`SELECT date FROM "flight" WHERE id = 1`);
                // console.log(results);
                return [4 /*yield*/, postgresConnection.query("INSERT INTO \"flight\" (\"id\", \"date\") VALUES (1, '" + testDateString + "');")];
                case 1:
                    // await postgresConnection.query(`INSERT INTO "flight" ("id", "date") VALUES (1, '1989-08-16 14:00:00.000000 +03:00');`);
                    // const results = await postgresConnection.query(`SELECT date FROM "flight" WHERE id = 1`);
                    // console.log(results);
                    _a.sent();
                    return [4 /*yield*/, postgresConnection.manager.findOne(Flight_1.Flight, 1)];
                case 2:
                    flight = _a.sent();
                    chai_1.expect(flight.date.toISOString()).to.equal(new Date(testDateString).toISOString());
                    return [2 /*return*/];
            }
        });
    }); });
    it("should persist date & time to the PostgreSQL database correctly", function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var testDate, results;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    testDate = new Date(testDateString);
                    return [4 /*yield*/, postgresConnection.manager.save(new Flight_1.Flight(1, testDate))];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, postgresConnection.query("SELECT \"date\" FROM \"flight\" WHERE id = 1")];
                case 2:
                    results = _a.sent();
                    chai_1.expect(results[0].date.toISOString()).to.equal(testDate.toISOString());
                    return [2 /*return*/];
            }
        });
    }); });
});
//# sourceMappingURL=issue-838.js.map