"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var ActivityEntity_1 = require("./entity/ActivityEntity");
describe("github issues > #320 Bug in getManyAndCount", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                        enabledDrivers: ["mysql"],
                    })];
                case 1: return [2 /*return*/, connections = _a.sent()];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should correctly parse type from PrimaryGeneratedColumn options", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var tiles, query;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    tiles = [2, 3];
                    query = connection.createQueryBuilder(ActivityEntity_1.ActivityEntity, "activity")
                        .innerJoinAndSelect("activity.tiles", "tile")
                        .select("activity.id")
                        .orderBy("activity.endDate", "DESC");
                    query = query
                        .innerJoin("(SELECT " +
                        "COUNT(activityId) AS matchedTileCount, " +
                        "tile_activities_activity.activityId " +
                        "FROM tile " +
                        "INNER JOIN tile_activities_activity " +
                        "ON tile.id = tile_activities_activity.tileId " +
                        "WHERE tile.id IN (:...tiles) " +
                        "GROUP BY activityId)", "b", "b.activityId = activity.id")
                        .addSelect("b.matchedTileCount")
                        .addSelect("COUNT(activity.id) as tileCount")
                        .groupBy("activity.id, tile.id")
                        .having("b.matchedTileCount = :tileCount")
                        .orHaving("tileCount <= b.matchedTileCount")
                        .setParameter("tiles", tiles)
                        .setParameter("tileCount", tiles.length);
                    return [4 /*yield*/, query.getMany];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-320.js.map