"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var src_1 = require("../../../src");
var test_utils_1 = require("../../utils/test-utils");
var User_1 = require("./entity/User");
var Photo_1 = require("./entity/Photo");
describe("github issues > #2031 Advanced find options with FKs", function () {
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
    it("find operators should work with relational columns as well", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var user, photo, photos;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    user = new User_1.User();
                    user.firstName = "Timber";
                    user.lastName = "Saw";
                    user.age = 25;
                    return [4 /*yield*/, connection.manager.save(user)];
                case 1:
                    _a.sent();
                    photo = new Photo_1.Photo();
                    photo.description = "Tall trees";
                    photo.uri = "www.pictures.pic/1";
                    photo.userId = user.id;
                    return [4 /*yield*/, connection.manager.save(photo)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, connection.manager.find(Photo_1.Photo, { where: { userId: src_1.Equal(user.id) } })];
                case 3:
                    photos = _a.sent();
                    photos.should.be.eql([{
                            id: 1,
                            description: "Tall trees",
                            uri: "www.pictures.pic/1",
                            userId: 1,
                        }]);
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-2031.js.map