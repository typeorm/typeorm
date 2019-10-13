"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var test_utils_1 = require("../../utils/test-utils");
var chai_1 = require("chai");
var User_1 = require("./entity/User");
var TournamentUserParticipant_1 = require("./entity/TournamentUserParticipant");
var TournamentSquadParticipant_1 = require("./entity/TournamentSquadParticipant");
describe("github issues > #1972 STI problem - empty columns", function () {
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
    it("should insert with userId", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var user, tournamentUserParticipant, result;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    user = new User_1.User({
                        name: "test",
                    });
                    return [4 /*yield*/, connection.manager.save(user)];
                case 1:
                    _a.sent();
                    tournamentUserParticipant = new TournamentUserParticipant_1.TournamentUserParticipant({
                        user: user,
                    });
                    return [4 /*yield*/, connection.manager.save(tournamentUserParticipant)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, connection.manager.findOne(TournamentUserParticipant_1.TournamentUserParticipant)];
                case 3:
                    result = _a.sent();
                    if (result) {
                        chai_1.assert(result.user instanceof User_1.User);
                    }
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should insert with ownerId", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var user, tournamentSquadParticipant, result;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    user = new User_1.User({
                        name: "test",
                    });
                    return [4 /*yield*/, connection.manager.save(user)];
                case 1:
                    _a.sent();
                    tournamentSquadParticipant = new TournamentSquadParticipant_1.TournamentSquadParticipant({
                        users: [user],
                        owner: user,
                    });
                    return [4 /*yield*/, connection.manager.save(tournamentSquadParticipant)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, connection.manager.findOne(TournamentSquadParticipant_1.TournamentSquadParticipant)];
                case 3:
                    result = _a.sent();
                    if (result) {
                        chai_1.assert(result.owner instanceof User_1.User);
                    }
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-1972.js.map