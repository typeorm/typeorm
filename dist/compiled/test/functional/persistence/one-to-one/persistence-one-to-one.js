"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var chai_1 = require("chai");
var User_1 = require("./entity/User");
var AccessToken_1 = require("./entity/AccessToken");
var test_utils_1 = require("../../../utils/test-utils");
describe("persistence > one-to-one", function () {
    // -------------------------------------------------------------------------
    // Setup
    // -------------------------------------------------------------------------
    var connections;
    before(function () {
        return test_utils_1.createTestingConnections({
            entities: [User_1.User, AccessToken_1.AccessToken],
        }).then(function (all) { return connections = all; });
    });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    // -------------------------------------------------------------------------
    // Specifications
    // -------------------------------------------------------------------------
    describe("set the relation with proper item", function () {
        var _this = this;
        it("should have an access token", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var userRepository, accessTokenRepository, newUser, newAccessToken, loadedUser;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        userRepository = connection.getRepository(User_1.User);
                        accessTokenRepository = connection.getRepository(AccessToken_1.AccessToken);
                        newUser = userRepository.create();
                        newUser.email = "mwelnick@test.com";
                        return [4 /*yield*/, userRepository.save(newUser)];
                    case 1:
                        _a.sent();
                        newAccessToken = accessTokenRepository.create();
                        newAccessToken.user = newUser;
                        return [4 /*yield*/, accessTokenRepository.save(newAccessToken)];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, userRepository.findOne({
                                where: { email: "mwelnick@test.com" },
                                relations: ["access_token"]
                            })];
                    case 3:
                        loadedUser = _a.sent();
                        chai_1.expect(loadedUser).not.to.be.undefined;
                        chai_1.expect(loadedUser.access_token).not.to.be.undefined;
                        return [2 /*return*/];
                }
            });
        }); })); });
    });
    describe("doesn't allow the same relation to be used twice", function () {
        var _this = this;
        it("should reject the saving attempt", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var userRepository, accessTokenRepository, newUser, newAccessToken1, newAccessToken2, error, err_1, _a, _b;
            return tslib_1.__generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        userRepository = connection.getRepository(User_1.User);
                        accessTokenRepository = connection.getRepository(AccessToken_1.AccessToken);
                        newUser = userRepository.create();
                        newUser.email = "mwelnick@test.com";
                        return [4 /*yield*/, userRepository.save(newUser)];
                    case 1:
                        _c.sent();
                        newAccessToken1 = accessTokenRepository.create();
                        newAccessToken1.user = newUser;
                        return [4 /*yield*/, accessTokenRepository.save(newAccessToken1)];
                    case 2:
                        _c.sent();
                        newAccessToken2 = accessTokenRepository.create();
                        newAccessToken2.user = newUser;
                        error = null;
                        _c.label = 3;
                    case 3:
                        _c.trys.push([3, 5, , 6]);
                        return [4 /*yield*/, accessTokenRepository.save(newAccessToken2)];
                    case 4:
                        _c.sent();
                        return [3 /*break*/, 6];
                    case 5:
                        err_1 = _c.sent();
                        error = err_1;
                        return [3 /*break*/, 6];
                    case 6:
                        chai_1.expect(error).to.be.instanceof(Error);
                        _a = chai_1.expect;
                        return [4 /*yield*/, userRepository.count({})];
                    case 7:
                        _a.apply(void 0, [_c.sent()]).to.equal(1);
                        _b = chai_1.expect;
                        return [4 /*yield*/, accessTokenRepository.count({})];
                    case 8:
                        _b.apply(void 0, [_c.sent()]).to.equal(1);
                        return [2 /*return*/];
                }
            });
        }); })); });
    });
});
//# sourceMappingURL=persistence-one-to-one.js.map