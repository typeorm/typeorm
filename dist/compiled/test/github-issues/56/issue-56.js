"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var User_1 = require("./entity/User");
var chai_1 = require("chai");
var AccessToken_1 = require("./entity/AccessToken");
describe.skip("github issues > #56 relationships only work when both primary keys have the same name", function () {
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
    it("should persist successfully and return persisted entity", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var token, user;
        return tslib_1.__generator(this, function (_a) {
            token = new AccessToken_1.AccessToken();
            token.access_token = "12345";
            user = new User_1.User();
            user.email = "mwelnick@test.com";
            user.access_token = token;
            return [2 /*return*/, connection.getRepository(AccessToken_1.AccessToken).save(token).then(function (token) {
                    return connection.getRepository(User_1.User).save(user);
                }).then(function (user) {
                    chai_1.expect(user).not.to.be.undefined;
                    user.should.be.eql({
                        id: 1,
                        email: "mwelnick@test.com",
                        access_token: {
                            access_token: "12345"
                        }
                    });
                })];
        });
    }); })); });
});
//# sourceMappingURL=issue-56.js.map