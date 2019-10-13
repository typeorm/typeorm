"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var User_1 = require("./entity/User");
var Photo_1 = require("./entity/Photo");
describe.skip("github issues > #1591 Define order of relation data when querying on the main entity", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                        enabledDrivers: ["mysql"]
                    })];
                case 1: return [2 /*return*/, connections = _a.sent()];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should query correct number of users with joined data ordering applied", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var i, photo1, photo2, user;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    i = 0;
                    _a.label = 1;
                case 1:
                    if (!(i < 30)) return [3 /*break*/, 6];
                    photo1 = new Photo_1.Photo();
                    photo1.name = "Photo #" + i + "_1";
                    photo1.date = new Date(2018, 0, i);
                    return [4 /*yield*/, connection.manager.save(photo1)];
                case 2:
                    _a.sent();
                    photo2 = new Photo_1.Photo();
                    photo2.name = "Photo #" + i + "_1";
                    photo2.date = new Date(2016, 0, i);
                    return [4 /*yield*/, connection.manager.save(photo2)];
                case 3:
                    _a.sent();
                    user = new User_1.User();
                    user.name = "User #" + i;
                    user.photos = [photo1, photo2];
                    return [4 /*yield*/, connection.manager.save(user)];
                case 4:
                    _a.sent();
                    _a.label = 5;
                case 5:
                    i++;
                    return [3 /*break*/, 1];
                case 6: return [4 /*yield*/, connection
                        .createQueryBuilder(User_1.User, "user")
                        .leftJoinAndSelect("user.photos", "photo")
                        .orderBy("user.name")
                        .addOrderBy("photo.date")
                        .skip(0)
                        .take(5)
                        .getMany()];
                case 7:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-1591.js.map