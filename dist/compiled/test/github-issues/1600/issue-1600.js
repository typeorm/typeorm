"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var User_1 = require("./entity/User");
describe("github issues > #1600 Postgres: QueryBuilder insert with Postgres array type bug", function () {
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
    it("should insert successfully using save method", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var users, i, user, loadedUsers1, loadedUsers2, loadedUsers3;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    users = [];
                    for (i = 0; i < 10; i++) {
                        user = new User_1.User();
                        user.names = ["user #" + i];
                        users.push(user);
                    }
                    return [4 /*yield*/, connection.manager.save(users)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, connection
                            .createQueryBuilder(User_1.User, "user")
                            .getMany()];
                case 2:
                    loadedUsers1 = _a.sent();
                    loadedUsers1.length.should.be.equal(10);
                    return [4 /*yield*/, connection
                            .createQueryBuilder(User_1.User, "user")
                            .where("user.id IN (:...ids)", { ids: [1, 2, 3, 15] })
                            .getMany()];
                case 3:
                    loadedUsers2 = _a.sent();
                    loadedUsers2.length.should.be.equal(3);
                    return [4 /*yield*/, connection
                            .createQueryBuilder(User_1.User, "user")
                            .where("user.id = ANY(:ids)", { ids: [1, 2, 15] })
                            .getMany()];
                case 4:
                    loadedUsers3 = _a.sent();
                    loadedUsers3.length.should.be.equal(2);
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should insert successfully using insert method", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var users, i, user, loadedUsers;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    users = [];
                    for (i = 0; i < 10; i++) {
                        user = new User_1.User();
                        user.names = ["user #" + i];
                        users.push(user);
                    }
                    return [4 /*yield*/, connection
                            .createQueryBuilder()
                            .insert()
                            .into(User_1.User)
                            .values(users)
                            .execute()];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, connection
                            .createQueryBuilder(User_1.User, "user")
                            .getMany()];
                case 2:
                    loadedUsers = _a.sent();
                    loadedUsers.length.should.be.equal(10);
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-1600.js.map