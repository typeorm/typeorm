"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var User_1 = require("./entity/User");
var UserCredential_1 = require("./entity/UserCredential");
describe("github issues > #836 .save won't update entity when it contains OneToOne relationship", function () {
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
        var user1, user2, credential, loadedCredentials;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    user1 = new User_1.User();
                    user1.email = "user1@user.com";
                    user1.username = "User 1";
                    user1.privilege = 0;
                    return [4 /*yield*/, connection.manager.save(user1)];
                case 1:
                    _a.sent();
                    user2 = new User_1.User();
                    user2.email = "user2@user.com";
                    user2.username = "User 2";
                    user2.privilege = 0;
                    credential = new UserCredential_1.UserCredential();
                    credential.password = "ABC";
                    credential.salt = "CDE";
                    credential.user = user2;
                    return [4 /*yield*/, connection.manager.save(credential)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, connection.manager.findOne(UserCredential_1.UserCredential, 2, { relations: ["user"] })];
                case 3:
                    loadedCredentials = _a.sent();
                    loadedCredentials.should.be.eql({
                        user: {
                            id: 2,
                            email: "user2@user.com",
                            username: "User 2",
                            privilege: 0
                        },
                        password: "ABC",
                        salt: "CDE"
                    });
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-836.js.map