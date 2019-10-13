"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var User_1 = require("./entity/User");
describe("github issues > #704 Table alias in WHERE clause is not quoted in PostgreSQL", function () {
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
    it("should return user by a given email and proper escape 'user' keyword", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var user, loadedUser;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    user = new User_1.User();
                    user.email = "john@example.com";
                    return [4 /*yield*/, connection.manager.save(user)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, connection.getRepository(User_1.User).findOne({ email: "john@example.com" })];
                case 2:
                    loadedUser = _a.sent();
                    loadedUser.id.should.be.equal(1);
                    loadedUser.email.should.be.equal("john@example.com");
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-704.js.map