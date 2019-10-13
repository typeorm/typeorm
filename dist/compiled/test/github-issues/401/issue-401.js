"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var chai_1 = require("chai");
var Player_1 = require("./entity/Player");
var Group_1 = require("./entity/Group");
describe("github issues > #401 special keywords should be escaped in join queries", function () {
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
    it("should escape 'group' keyword properly", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var group, player, loadedPlayer;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    group = new Group_1.Group();
                    group.name = "about players";
                    return [4 /*yield*/, connection.manager.save(group)];
                case 1:
                    _a.sent();
                    player = new Player_1.Player();
                    player.email = "player@gmail.com";
                    player.group = group;
                    return [4 /*yield*/, connection.manager.save(player)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, connection
                            .getRepository(Player_1.Player)
                            .createQueryBuilder("player")
                            .leftJoinAndSelect("player.group", "group")
                            .where("player.email = :email", { email: "player@gmail.com" })
                            .getOne()];
                case 3:
                    loadedPlayer = _a.sent();
                    chai_1.expect(loadedPlayer).to.be.eql({
                        email: "player@gmail.com",
                        group: {
                            id: 1,
                            name: "about players"
                        }
                    });
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-401.js.map