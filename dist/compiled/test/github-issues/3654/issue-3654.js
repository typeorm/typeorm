"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var test_utils_1 = require("../../utils/test-utils");
var User_1 = require("./entity/User");
describe("github issues > #3654 Should be able compare buffer type", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                        enabledDrivers: ["mysql"]
                    })];
                case 1: return [2 /*return*/, (connections = _a.sent())];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("Repository.save() method should be able compare buffer type for deciding if save or update ops.", function () {
        return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var userRepo, userId, user, dbUser, confirmUser;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        userRepo = connection.getRepository(User_1.User);
                        userId = "4321226123455910A532153E57A78445".toLowerCase();
                        user = new User_1.User();
                        user.id = userId;
                        user.age = 25;
                        return [4 /*yield*/, userRepo.save(user)];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, userRepo.find({
                                where: {
                                    id: Buffer.from(userId, "hex")
                                }
                            })];
                    case 2:
                        dbUser = (_a.sent())[0];
                        dbUser.age = 26;
                        return [4 /*yield*/, userRepo.save(dbUser)];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, userRepo.find({
                                where: {
                                    id: Buffer.from(userId, "hex")
                                }
                            })];
                    case 4:
                        confirmUser = (_a.sent())[0];
                        confirmUser.id.should.be.eql(userId);
                        confirmUser.age.should.be.eql(26);
                        return [2 /*return*/];
                }
            });
        }); }));
    });
});
//# sourceMappingURL=issue-3654.js.map