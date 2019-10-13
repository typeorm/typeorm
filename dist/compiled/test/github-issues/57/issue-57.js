"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var User_1 = require("./entity/User");
var chai_1 = require("chai");
var AccessToken_1 = require("./entity/AccessToken");
describe("github issues > #57 cascade insert not working with OneToOne relationship", function () {
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
    // this test is no absolutely complete because cascade is now only allowed from one side of the relation
    it("should persist successfully from inverse side", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var token, user, tokens, users;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    token = new AccessToken_1.AccessToken();
                    user = new User_1.User();
                    user.email = "mwelnick@test.com";
                    user.access_token = token; // this is not necessary at all
                    token.user = user; // this is necessary to cascades to work because we are saving token, not user
                    // save
                    return [4 /*yield*/, connection.getRepository(AccessToken_1.AccessToken).save(token)];
                case 1:
                    // save
                    _a.sent();
                    return [4 /*yield*/, connection.getRepository(AccessToken_1.AccessToken)
                            .createQueryBuilder("token")
                            .innerJoinAndSelect("token.user", "user")
                            .getMany()];
                case 2:
                    tokens = _a.sent();
                    chai_1.expect(tokens).not.to.be.undefined;
                    tokens.should.be.eql([{
                            primaryKey: 1,
                            user: {
                                primaryKey: 1,
                                email: "mwelnick@test.com",
                            }
                        }]);
                    return [4 /*yield*/, connection.getRepository(User_1.User)
                            .createQueryBuilder("user")
                            .innerJoinAndSelect("user.access_token", "token")
                            .getMany()];
                case 3:
                    users = _a.sent();
                    chai_1.expect(users).not.to.be.undefined;
                    users.should.be.eql([{
                            primaryKey: 1,
                            email: "mwelnick@test.com",
                            access_token: {
                                primaryKey: 1
                            }
                        }]);
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-57.js.map