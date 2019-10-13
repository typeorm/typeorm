"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../../../utils/test-utils");
var Profile_1 = require("./entity/Profile");
var Photo_1 = require("./entity/Photo");
var User_1 = require("./entity/User");
describe("persistence > cascades > example 1", function () {
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
    it("should insert everything by cascades properly", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var photo, profile, user, loadedUser;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    photo = new Photo_1.Photo();
                    profile = new Profile_1.Profile();
                    profile.photo = photo;
                    user = new User_1.User();
                    user.profile = profile;
                    return [4 /*yield*/, connection.manager.save(user)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, connection.manager
                            .createQueryBuilder(User_1.User, "user")
                            .leftJoinAndSelect("user.profile", "profile")
                            .leftJoinAndSelect("profile.photo", "profilePhoto")
                            .leftJoinAndSelect("profile.user", "profileUser")
                            .getOne()];
                case 2:
                    loadedUser = _a.sent();
                    loadedUser.should.be.eql({
                        id: 1,
                        profile: {
                            id: 1,
                            photo: {
                                id: 1
                            },
                            user: {
                                id: 1
                            }
                        }
                    });
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=cascades-example1.js.map