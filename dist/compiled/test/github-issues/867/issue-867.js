"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var User_1 = require("./entity/User");
var chai_1 = require("chai");
describe("github issues > #867 result of `findAndCount` is wrong when apply `skip` and `take` option", function () {
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
    it("should work perfectly", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var userRepository, users, _a, foundUsers, totalCount;
        return tslib_1.__generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    userRepository = connection.getRepository(User_1.User);
                    users = new Array(5).fill(0).map(function (n, i) {
                        var user = new User_1.User();
                        user.username = "User_" + i;
                        return user;
                    });
                    return [4 /*yield*/, userRepository.save(users)];
                case 1:
                    _b.sent();
                    return [4 /*yield*/, userRepository.findAndCount({
                            skip: 1,
                            take: 2,
                            order: {
                                username: "ASC"
                            }
                        })];
                case 2:
                    _a = tslib_1.__read.apply(void 0, [_b.sent(), 2]), foundUsers = _a[0], totalCount = _a[1];
                    chai_1.expect(totalCount).to.equal(5);
                    chai_1.expect(foundUsers).to.have.lengthOf(2);
                    chai_1.expect(foundUsers[0].username).to.equal("User_1");
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-867.js.map