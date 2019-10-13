"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var chai_1 = require("chai");
var User_1 = require("./entity/User");
describe("github issues > #4096 SQLite support for orUpdate", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [User_1.User],
                        enabledDrivers: ["sqlite"],
                        schemaCreate: true,
                        dropSchema: true,
                    })];
                case 1: return [2 /*return*/, connections = _a.sent()];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should overwrite using current value in SQLite", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var user1, user2, UserRepository, users;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    user1 = new User_1.User();
                    user1.email = "example@example.org";
                    user1.username = "example";
                    user1.bio = "My bio";
                    user2 = new User_1.User();
                    user2.email = "example@example.org";
                    user2.username = "example";
                    user2.bio = "Updated bio";
                    UserRepository = connection.manager.getRepository(User_1.User);
                    return [4 /*yield*/, UserRepository
                            .createQueryBuilder()
                            .insert()
                            .into(User_1.User)
                            .values(user1)
                            .execute()];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, UserRepository
                            .createQueryBuilder()
                            .insert()
                            .into(User_1.User)
                            .values(user2)
                            .orUpdate({
                            conflict_target: ["email", "username"],
                            overwrite: ["bio"],
                        })
                            .execute()];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, UserRepository.find()];
                case 3:
                    users = _a.sent();
                    chai_1.expect(users).not.to.be.undefined;
                    chai_1.expect(users).to.have.lengthOf(1);
                    chai_1.expect(users[0]).to.includes({ bio: "Updated bio" });
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-4096.js.map