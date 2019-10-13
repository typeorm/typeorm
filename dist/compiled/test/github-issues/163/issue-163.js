"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var Game_1 = require("./entity/Game");
var Platform_1 = require("./entity/Platform");
var chai_1 = require("chai");
describe("github issues > #163 ManyToMany relation : Cannot read property 'joinColumnName' of undefined", function () {
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
    it("should persist class table child successfully", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var battlefront, republicCommando, platform, loadedPlatform, jediAcademy, completePlatform;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    battlefront = new Game_1.Game();
                    battlefront.name = "SW Battlefront";
                    battlefront.searchTerms = "star-wars,arcade";
                    battlefront.isReviewed = false;
                    republicCommando = new Game_1.Game();
                    republicCommando.name = "SW Republic Commando";
                    republicCommando.searchTerms = "star-wars,shooter";
                    republicCommando.isReviewed = false;
                    return [4 /*yield*/, connection.manager.save(battlefront)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, connection.manager.save(republicCommando)];
                case 2:
                    _a.sent();
                    platform = new Platform_1.Platform();
                    platform.name = "Windows";
                    platform.slug = "windows";
                    platform.games = [battlefront, republicCommando];
                    return [4 /*yield*/, connection.manager.save(platform)];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, connection
                            .getRepository(Platform_1.Platform)
                            .findOne({ where: { slug: "windows" } })];
                case 4:
                    loadedPlatform = _a.sent();
                    jediAcademy = new Game_1.Game();
                    jediAcademy.name = "SW Jedi Academy";
                    jediAcademy.searchTerms = "star-wars,arcade";
                    jediAcademy.platforms = [loadedPlatform];
                    jediAcademy.isReviewed = false;
                    return [4 /*yield*/, connection.manager.save(jediAcademy)];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, connection
                            .getRepository(Platform_1.Platform)
                            .createQueryBuilder("platform")
                            .leftJoinAndSelect("platform.games", "game")
                            .where("platform.slug=:slug", { slug: "windows" })
                            .orderBy("platform.id")
                            .addOrderBy("game.id")
                            .getOne()];
                case 6:
                    completePlatform = _a.sent();
                    chai_1.expect(completePlatform).not.to.be.undefined;
                    completePlatform.should.be.eql({
                        id: platform.id,
                        name: "Windows",
                        slug: "windows",
                        games: [{
                                id: battlefront.id,
                                name: "SW Battlefront",
                                searchTerms: "star-wars,arcade",
                                isReviewed: false
                            }, {
                                id: republicCommando.id,
                                name: "SW Republic Commando",
                                searchTerms: "star-wars,shooter",
                                isReviewed: false
                            }, {
                                id: jediAcademy.id,
                                name: "SW Jedi Academy",
                                searchTerms: "star-wars,arcade",
                                isReviewed: false
                            }]
                    });
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-163.js.map