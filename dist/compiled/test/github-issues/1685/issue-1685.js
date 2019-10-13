"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var year_1 = require("./entity/year");
var month_1 = require("./entity/month");
var user_1 = require("./entity/user");
var user_month_1 = require("./entity/user-month");
describe.skip("github issues > #1685 JoinColumn from JoinColum is not considered when inserting new value", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                        schemaCreate: true,
                        dropSchema: true,
                        enabledDrivers: ["mysql"]
                    })];
                case 1: return [2 /*return*/, connections = _a.sent()];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should not fail when inserting a new UserMonth with good PKs from JoinColumn", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var year, month, user, userMonth, err_1;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    year = new year_1.Year();
                    year.yearNo = 2018;
                    return [4 /*yield*/, connection.manager.save(year)];
                case 1:
                    _a.sent();
                    month = new month_1.Month();
                    month.year = year;
                    month.monthNo = 2;
                    month.yearNo = year.yearNo;
                    return [4 /*yield*/, connection.manager.save(month)];
                case 2:
                    _a.sent();
                    user = new user_1.User();
                    user.username = "bobs";
                    return [4 /*yield*/, connection.manager.save(user)];
                case 3:
                    _a.sent();
                    userMonth = new user_month_1.UserMonth();
                    userMonth.user = user;
                    userMonth.month = month;
                    _a.label = 4;
                case 4:
                    _a.trys.push([4, 6, , 7]);
                    return [4 /*yield*/, connection.manager.save(userMonth)];
                case 5:
                    _a.sent();
                    return [3 /*break*/, 7];
                case 6:
                    err_1 = _a.sent();
                    throw new Error("userMonth should be added");
                case 7: return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-1685.js.map