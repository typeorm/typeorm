"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var test_utils_1 = require("../../utils/test-utils");
var User_1 = require("./entity/User");
var Photo_1 = require("./entity/Photo");
describe("github issues > #2044 Should not double get embedded column value", function () {
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
    it("Insert query should work with relational columns", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var userId, photoId, user, photo, photos, resultPhoto;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    userId = "1234";
                    photoId = "4321";
                    user = new User_1.User();
                    user.id = userId;
                    user.age = 25;
                    return [4 /*yield*/, connection.manager.save(user)];
                case 1:
                    _a.sent();
                    photo = new Photo_1.Photo();
                    photo.id = photoId;
                    photo.description = "Tall trees";
                    photo.user = user;
                    return [4 /*yield*/, connection.manager.save(photo)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, connection.manager.find(Photo_1.Photo, {
                            relations: ["user"]
                        })];
                case 3:
                    photos = _a.sent();
                    resultPhoto = photos[0];
                    resultPhoto.id.should.be.eql(photoId);
                    resultPhoto.user.id.should.be.eql(userId);
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-2044.js.map