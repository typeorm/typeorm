"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var User_1 = require("./entity/User");
var chai_1 = require("chai");
describe("other issues > ekifox reported issue with increment", function () {
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
    it("getters and setters should work correctly", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var user, loadedUser;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    user = new User_1.User();
                    user.id = 1;
                    user.nickName = "pleerock";
                    return [4 /*yield*/, connection.manager.save(user)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, connection.manager.update(User_1.User, { id: 1 }, {
                            friendsInvitesCount: function () { return "friends_invites_count + 1"; }
                        })];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, connection
                            .manager
                            .createQueryBuilder(User_1.User, "user")
                            .where("user.id = :id", { id: 1 })
                            .getOne()];
                case 3:
                    loadedUser = _a.sent();
                    chai_1.expect(loadedUser).not.to.be.undefined;
                    loadedUser.id.should.be.equal(1);
                    loadedUser.friendsInvitesCount.should.be.equal(1);
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=ekifox-increment-issue.js.map