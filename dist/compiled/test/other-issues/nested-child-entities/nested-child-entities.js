"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var test_utils_1 = require("../../utils/test-utils");
var TournamentGraph_1 = require("./entity/TournamentGraph");
var SquadBilliardsTournament_1 = require("./entity/SquadBilliardsTournament");
describe("other issues > using nested child entities", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                        enabledDrivers: ["postgres"]
                    })];
                case 1: return [2 /*return*/, connections = _a.sent()];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should insert without error", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var squadBilliardsTournament, tournamentGraph;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    squadBilliardsTournament = new SquadBilliardsTournament_1.SquadBilliardsTournament({
                        name: "Squad Tournament",
                    });
                    return [4 /*yield*/, connection.manager.save(squadBilliardsTournament)];
                case 1:
                    _a.sent();
                    tournamentGraph = new TournamentGraph_1.TournamentGraph();
                    tournamentGraph.tournament = squadBilliardsTournament;
                    return [4 /*yield*/, connection.manager.save(tournamentGraph)];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=nested-child-entities.js.map