"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var Post_1 = require("./entity/Post");
describe("github issues > #3949 sqlite date hydration is susceptible to corruption", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                        schemaCreate: true,
                        dropSchema: true,
                        enabledDrivers: ["sqlite", "sqljs"],
                    })];
                case 1:
                    connections = _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    var testDateString = function (sqlDateString, jsDateString) { return function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var queryRunner, repo, post;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    queryRunner = connection.createQueryRunner();
                    repo = connection.getRepository(Post_1.Post);
                    return [4 /*yield*/, queryRunner.query("INSERT INTO \"POST\"(\"id\", \"date\") VALUES (?, ?)", [1, sqlDateString])];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, repo.findOne(1)];
                case 2:
                    post = _a.sent();
                    post.date.should.eql(new Date(jsDateString));
                    return [2 /*return*/];
            }
        });
    }); }; };
    it("should correctly read date column that was inserted raw in canonical format", function () {
        // Append UTC to javascript date string, because while sqlite assumes naive date strings are UTC,
        // javascript assumes they are in local system time.
        return Promise.all(connections.map(testDateString("2018-03-14 02:33:33.906", "2018-03-14T02:33:33.906Z")));
    });
    it("should correctly read date column that was inserted raw in iso 8601 format", function () {
        return Promise.all(connections.map(testDateString("2018-03-14T02:33:33.906+00:00", "2018-03-14T02:33:33.906Z")));
    });
});
//# sourceMappingURL=issue-3949.js.map