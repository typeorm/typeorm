"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var chai_1 = require("chai");
var test_utils_1 = require("../../../utils/test-utils");
var User_1 = require("./entity/User");
var Photo_1 = require("./entity/Photo");
describe("query builder > delete", function () {
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
    it("should perform deletion correctly", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var user1, loadedUser1, user2, loadedUser2;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    user1 = new User_1.User();
                    user1.name = "Alex Messer";
                    return [4 /*yield*/, connection.manager.save(user1)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, connection.createQueryBuilder()
                            .delete()
                            .from(User_1.User)
                            .where("name = :name", { name: "Alex Messer" })
                            .execute()];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, connection.getRepository(User_1.User).findOne({ name: "Dima Zotov" })];
                case 3:
                    loadedUser1 = _a.sent();
                    chai_1.expect(loadedUser1).to.not.exist;
                    user2 = new User_1.User();
                    user2.name = "Alex Messer";
                    return [4 /*yield*/, connection.manager.save(user2)];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, connection.getRepository(User_1.User)
                            .createQueryBuilder("myUser")
                            .delete()
                            .where("name = :name", { name: "Dima Zotov" })
                            .execute()];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, connection.getRepository(User_1.User).findOne({ name: "Dima Zotov" })];
                case 6:
                    loadedUser2 = _a.sent();
                    chai_1.expect(loadedUser2).to.not.exist;
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should be able to delete entities by embed criteria", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var loadedPhoto1, loadedPhoto2, loadedPhoto3, loadedPhoto4;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: 
                // save few photos
                return [4 /*yield*/, connection.manager.save(Photo_1.Photo, { url: "1.jpg" })];
                case 1:
                    // save few photos
                    _a.sent();
                    return [4 /*yield*/, connection.manager.save(Photo_1.Photo, {
                            url: "2.jpg",
                            counters: {
                                likes: 2,
                                favorites: 1,
                                comments: 1,
                            }
                        })];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, connection.manager.save(Photo_1.Photo, { url: "3.jpg" })];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, connection.getRepository(Photo_1.Photo).findOne({ counters: { likes: 2 } })];
                case 4:
                    loadedPhoto1 = _a.sent();
                    chai_1.expect(loadedPhoto1).to.exist;
                    loadedPhoto1.should.be.eql({
                        id: 2,
                        url: "2.jpg",
                        counters: {
                            likes: 2,
                            favorites: 1,
                            comments: 1,
                        }
                    });
                    // delete photo now
                    return [4 /*yield*/, connection.getRepository(Photo_1.Photo)
                            .createQueryBuilder("photo")
                            .delete()
                            .where({
                            counters: {
                                likes: 2
                            }
                        })
                            .execute()];
                case 5:
                    // delete photo now
                    _a.sent();
                    return [4 /*yield*/, connection.getRepository(Photo_1.Photo).findOne({ url: "1.jpg" })];
                case 6:
                    loadedPhoto2 = _a.sent();
                    chai_1.expect(loadedPhoto2).to.exist;
                    return [4 /*yield*/, connection.getRepository(Photo_1.Photo).findOne({ url: "2.jpg" })];
                case 7:
                    loadedPhoto3 = _a.sent();
                    chai_1.expect(loadedPhoto3).not.to.exist;
                    return [4 /*yield*/, connection.getRepository(Photo_1.Photo).findOne({ url: "3.jpg" })];
                case 8:
                    loadedPhoto4 = _a.sent();
                    chai_1.expect(loadedPhoto4).to.exist;
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should return correct delete result", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var user1, user2, result;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    // don't run test for sqlite and sqljs as they don't return affected rows
                    if (connection.name === "sqlite" || connection.name === "sqljs")
                        return [2 /*return*/];
                    user1 = new User_1.User();
                    user1.name = "John Doe";
                    user2 = new User_1.User();
                    user2.name = "Jane Doe";
                    return [4 /*yield*/, connection.manager.save([user1, user2])];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, connection.createQueryBuilder()
                            .delete()
                            .from(User_1.User)
                            .execute()];
                case 2:
                    result = _a.sent();
                    chai_1.expect(result.affected).to.equal(2);
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=query-builder-delete.js.map