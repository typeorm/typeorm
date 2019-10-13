"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var Tournament_1 = require("./entity/Tournament");
describe("github issues > #807 Error in persisting dates", function () {
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
    it("should be able to save dates as objects", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var tournament;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    tournament = new Tournament_1.Tournament();
                    tournament.name = "One";
                    tournament.startDate = new Date();
                    tournament.endDate = new Date();
                    return [4 /*yield*/, connection.manager.save(tournament)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should be able to save dates as strings", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var tournament;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    tournament = Object.assign(new Tournament_1.Tournament(), {
                        name: "One",
                        startDate: "2017-08-28T00:00:00.000Z",
                        endDate: "2017-08-31T23:59:59.999Z",
                    });
                    return [4 /*yield*/, connection.manager.save(tournament)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-807.js.map