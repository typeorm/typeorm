"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var chai_1 = require("chai");
var user_1 = require("./entity/user");
describe("github issues > #953 MySQL 5.7 JSON column parse", function () {
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
    it("should retrieve record from mysql5.7 using driver mysql2", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var repo, newUser, user, user1;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    repo = connection.getRepository(user_1.User);
                    newUser = new user_1.User();
                    newUser.username = "admin";
                    newUser.password = "admin";
                    newUser.roles = ["admin"];
                    newUser.lastLoginAt = new Date();
                    user = repo.create(newUser);
                    return [4 /*yield*/, repo.save(user)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, repo.findOne({ username: "admin" })];
                case 2:
                    user1 = _a.sent();
                    chai_1.expect(user1).has.property("roles").with.is.an("array").and.contains("admin");
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-953.js.map