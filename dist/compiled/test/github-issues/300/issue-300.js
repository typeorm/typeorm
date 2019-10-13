"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var chai_1 = require("chai");
var Race_1 = require("./entity/Race");
describe("github issues > support of embeddeds that are not set", function () {
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
    it("embedded with custom column name should persist and load without errors", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var race, loadedRace;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    race = new Race_1.Race();
                    race.name = "National Race";
                    return [4 /*yield*/, connection.manager.save(race)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, connection.manager.findOne(Race_1.Race, { name: "National Race" })];
                case 2:
                    loadedRace = _a.sent();
                    chai_1.expect(loadedRace).to.exist;
                    chai_1.expect(loadedRace.id).to.exist;
                    loadedRace.name.should.be.equal("National Race");
                    chai_1.expect(loadedRace.duration).to.exist;
                    chai_1.expect(loadedRace.duration.minutes).to.be.null;
                    chai_1.expect(loadedRace.duration.hours).to.be.null;
                    chai_1.expect(loadedRace.duration.days).to.be.null;
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-300.js.map