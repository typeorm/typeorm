"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../../../utils/test-utils");
var Photo_1 = require("./entity/Photo");
var User_1 = require("./entity/User");
// todo: fix later
describe.skip("persistence > cascades > remove", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () { return tslib_1.__generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({ __dirname: __dirname, enabledDrivers: ["mysql"] })];
            case 1: return [2 /*return*/, connections = _a.sent()];
        }
    }); }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should remove everything by cascades properly", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var user, loadedUser, manyPhotoNames, manyToManyPhotoNames, allPhotos;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, connection.manager.save(new Photo_1.Photo("Photo #1"))];
                case 1:
                    _a.sent();
                    user = new User_1.User();
                    user.id = 1;
                    user.name = "Mr. Cascade Danger";
                    user.manyPhotos = [new Photo_1.Photo("one-to-many #1"), new Photo_1.Photo("one-to-many #2")];
                    user.manyToManyPhotos = [new Photo_1.Photo("many-to-many #1"), new Photo_1.Photo("many-to-many #2"), new Photo_1.Photo("many-to-many #3")];
                    return [4 /*yield*/, connection.manager.save(user)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, connection.manager
                            .createQueryBuilder(User_1.User, "user")
                            .leftJoinAndSelect("user.manyPhotos", "manyPhotos")
                            .leftJoinAndSelect("user.manyToManyPhotos", "manyToManyPhotos")
                            .getOne()];
                case 3:
                    loadedUser = _a.sent();
                    loadedUser.id.should.be.equal(1);
                    loadedUser.name.should.be.equal("Mr. Cascade Danger");
                    manyPhotoNames = loadedUser.manyPhotos.map(function (photo) { return photo.name; });
                    manyPhotoNames.length.should.be.equal(2);
                    manyPhotoNames.should.deep.include("one-to-many #1");
                    manyPhotoNames.should.deep.include("one-to-many #2");
                    manyToManyPhotoNames = loadedUser.manyToManyPhotos.map(function (photo) { return photo.name; });
                    manyToManyPhotoNames.length.should.be.equal(3);
                    manyToManyPhotoNames.should.deep.include("many-to-many #1");
                    manyToManyPhotoNames.should.deep.include("many-to-many #2");
                    manyToManyPhotoNames.should.deep.include("many-to-many #3");
                    return [4 /*yield*/, connection.manager.remove(user)];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, connection.manager.find(Photo_1.Photo)];
                case 5:
                    allPhotos = _a.sent();
                    allPhotos.length.should.be.equal(1);
                    allPhotos[0].name.should.be.equal("Photo #1");
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=cascades-remove.js.map