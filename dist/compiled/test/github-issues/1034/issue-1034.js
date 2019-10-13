"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var User_1 = require("./entity/User");
var Circle_1 = require("./entity/Circle");
var chai_1 = require("chai");
describe("github issues > #1034 Issue using setter with promises", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                        enabledDrivers: ["mysql"] // we are using lazy relations that's why we are using a single driver
                    })];
                case 1: return [2 /*return*/, connections = _a.sent()];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should set members in circle", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var users, user, circle, circleFromDB, _a, _b;
        return tslib_1.__generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    users = [];
                    user = new User_1.User();
                    user.setId("1");
                    circle = new Circle_1.Circle();
                    circle.setId("1");
                    // Entities persistance
                    return [4 /*yield*/, connection.manager.save(user)];
                case 1:
                    // Entities persistance
                    _c.sent();
                    return [4 /*yield*/, connection.manager.save(circle)];
                case 2:
                    _c.sent();
                    users.push(user);
                    return [4 /*yield*/, connection.manager.findOne(Circle_1.Circle, circle.getId())];
                case 3:
                    circleFromDB = _c.sent();
                    chai_1.expect(circleFromDB).is.not.undefined;
                    // Setting users with setter
                    circleFromDB.setUsers(Promise.resolve(users));
                    return [4 /*yield*/, Promise.resolve()];
                case 4:
                    _c.sent(); // this is unpleasant way to fix this issue
                    _b = (_a = chai_1.expect(users).deep).equal;
                    return [4 /*yield*/, circleFromDB.getUsers()];
                case 5:
                    _b.apply(_a, [_c.sent()]);
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-1034.js.map