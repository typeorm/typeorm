"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var chai_1 = require("chai");
var test_utils_1 = require("../../../utils/test-utils");
var User_1 = require("./entity/User");
describe("query builder > cache", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                        cache: true,
                    })];
                case 1: return [2 /*return*/, connections = _a.sent()];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should cache results properly", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var user1, user2, user3, users1, user4, users2, users3, users4;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    user1 = new User_1.User();
                    user1.firstName = "Timber";
                    user1.lastName = "Saw";
                    user1.isAdmin = false;
                    return [4 /*yield*/, connection.manager.save(user1)];
                case 1:
                    _a.sent();
                    user2 = new User_1.User();
                    user2.firstName = "Alex";
                    user2.lastName = "Messer";
                    user2.isAdmin = false;
                    return [4 /*yield*/, connection.manager.save(user2)];
                case 2:
                    _a.sent();
                    user3 = new User_1.User();
                    user3.firstName = "Umed";
                    user3.lastName = "Pleerock";
                    user3.isAdmin = true;
                    return [4 /*yield*/, connection.manager.save(user3)];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, connection
                            .createQueryBuilder(User_1.User, "user")
                            .where("user.isAdmin = :isAdmin", { isAdmin: true })
                            .cache(true)
                            .getMany()];
                case 4:
                    users1 = _a.sent();
                    chai_1.expect(users1.length).to.be.equal(1);
                    user4 = new User_1.User();
                    user4.firstName = "Bakhrom";
                    user4.lastName = "Brochik";
                    user4.isAdmin = true;
                    return [4 /*yield*/, connection.manager.save(user4)];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, connection
                            .createQueryBuilder(User_1.User, "user")
                            .where("user.isAdmin = :isAdmin", { isAdmin: true })
                            .getMany()];
                case 6:
                    users2 = _a.sent();
                    chai_1.expect(users2.length).to.be.equal(2);
                    return [4 /*yield*/, connection
                            .createQueryBuilder(User_1.User, "user")
                            .where("user.isAdmin = :isAdmin", { isAdmin: true })
                            .cache(true)
                            .getMany()];
                case 7:
                    users3 = _a.sent();
                    chai_1.expect(users3.length).to.be.equal(1);
                    // give some time for cache to expire
                    return [4 /*yield*/, test_utils_1.sleep(1000)];
                case 8:
                    // give some time for cache to expire
                    _a.sent();
                    return [4 /*yield*/, connection
                            .createQueryBuilder(User_1.User, "user")
                            .where("user.isAdmin = :isAdmin", { isAdmin: true })
                            .cache(true)
                            .getMany()];
                case 9:
                    users4 = _a.sent();
                    chai_1.expect(users4.length).to.be.equal(2);
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should cache results with pagination enabled properly", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var user1, user2, user3, users1, user4, users2, users3, users4;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    user1 = new User_1.User();
                    user1.firstName = "Timber";
                    user1.lastName = "Saw";
                    user1.isAdmin = false;
                    return [4 /*yield*/, connection.manager.save(user1)];
                case 1:
                    _a.sent();
                    user2 = new User_1.User();
                    user2.firstName = "Alex";
                    user2.lastName = "Messer";
                    user2.isAdmin = false;
                    return [4 /*yield*/, connection.manager.save(user2)];
                case 2:
                    _a.sent();
                    user3 = new User_1.User();
                    user3.firstName = "Umed";
                    user3.lastName = "Pleerock";
                    user3.isAdmin = true;
                    return [4 /*yield*/, connection.manager.save(user3)];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, connection
                            .createQueryBuilder(User_1.User, "user")
                            .where("user.isAdmin = :isAdmin", { isAdmin: false })
                            .skip(1)
                            .take(5)
                            .orderBy("user.id")
                            .cache(true)
                            .getMany()];
                case 4:
                    users1 = _a.sent();
                    chai_1.expect(users1.length).to.be.equal(1);
                    user4 = new User_1.User();
                    user4.firstName = "Bakhrom";
                    user4.lastName = "Bro";
                    user4.isAdmin = false;
                    return [4 /*yield*/, connection.manager.save(user4)];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, connection
                            .createQueryBuilder(User_1.User, "user")
                            .where("user.isAdmin = :isAdmin", { isAdmin: false })
                            .skip(1)
                            .take(5)
                            .orderBy("user.id")
                            .getMany()];
                case 6:
                    users2 = _a.sent();
                    chai_1.expect(users2.length).to.be.equal(2);
                    return [4 /*yield*/, connection
                            .createQueryBuilder(User_1.User, "user")
                            .where("user.isAdmin = :isAdmin", { isAdmin: false })
                            .skip(1)
                            .take(5)
                            .cache(true)
                            .orderBy("user.id")
                            .getMany()];
                case 7:
                    users3 = _a.sent();
                    chai_1.expect(users3.length).to.be.equal(1);
                    // give some time for cache to expire
                    return [4 /*yield*/, test_utils_1.sleep(1000)];
                case 8:
                    // give some time for cache to expire
                    _a.sent();
                    return [4 /*yield*/, connection
                            .createQueryBuilder(User_1.User, "user")
                            .where("user.isAdmin = :isAdmin", { isAdmin: false })
                            .skip(1)
                            .take(5)
                            .cache(true)
                            .orderBy("user.id")
                            .getMany()];
                case 9:
                    users4 = _a.sent();
                    chai_1.expect(users4.length).to.be.equal(2);
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should cache results with custom id and duration supplied", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var user1, user2, user3, users1, user4, users2, users3, users4;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    user1 = new User_1.User();
                    user1.firstName = "Timber";
                    user1.lastName = "Saw";
                    user1.isAdmin = false;
                    return [4 /*yield*/, connection.manager.save(user1)];
                case 1:
                    _a.sent();
                    user2 = new User_1.User();
                    user2.firstName = "Alex";
                    user2.lastName = "Messer";
                    user2.isAdmin = false;
                    return [4 /*yield*/, connection.manager.save(user2)];
                case 2:
                    _a.sent();
                    user3 = new User_1.User();
                    user3.firstName = "Umed";
                    user3.lastName = "Pleerock";
                    user3.isAdmin = true;
                    return [4 /*yield*/, connection.manager.save(user3)];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, connection
                            .createQueryBuilder(User_1.User, "user")
                            .where("user.isAdmin = :isAdmin", { isAdmin: false })
                            .skip(1)
                            .take(5)
                            .cache("user_admins", 2000)
                            .orderBy("user.id")
                            .getMany()];
                case 4:
                    users1 = _a.sent();
                    chai_1.expect(users1.length).to.be.equal(1);
                    user4 = new User_1.User();
                    user4.firstName = "Bakhrom";
                    user4.lastName = "Bro";
                    user4.isAdmin = false;
                    return [4 /*yield*/, connection.manager.save(user4)];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, connection
                            .createQueryBuilder(User_1.User, "user")
                            .where("user.isAdmin = :isAdmin", { isAdmin: false })
                            .skip(1)
                            .take(5)
                            .orderBy("user.id")
                            .getMany()];
                case 6:
                    users2 = _a.sent();
                    chai_1.expect(users2.length).to.be.equal(2);
                    // give some time for cache to expire
                    return [4 /*yield*/, test_utils_1.sleep(1000)];
                case 7:
                    // give some time for cache to expire
                    _a.sent();
                    return [4 /*yield*/, connection
                            .createQueryBuilder(User_1.User, "user")
                            .where("user.isAdmin = :isAdmin", { isAdmin: false })
                            .skip(1)
                            .take(5)
                            .orderBy("user.id")
                            .cache("user_admins", 2000)
                            .getMany()];
                case 8:
                    users3 = _a.sent();
                    chai_1.expect(users3.length).to.be.equal(1);
                    // give some time for cache to expire
                    return [4 /*yield*/, test_utils_1.sleep(1000)];
                case 9:
                    // give some time for cache to expire
                    _a.sent();
                    return [4 /*yield*/, connection
                            .createQueryBuilder(User_1.User, "user")
                            .where("user.isAdmin = :isAdmin", { isAdmin: false })
                            .skip(1)
                            .take(5)
                            .orderBy("user.id")
                            .cache("user_admins", 2000)
                            .getMany()];
                case 10:
                    users4 = _a.sent();
                    chai_1.expect(users4.length).to.be.equal(2);
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should cache results with custom id and duration supplied", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var user1, user2, user3, users1, user4, users2, users3, users4;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    user1 = new User_1.User();
                    user1.firstName = "Timber";
                    user1.lastName = "Saw";
                    user1.isAdmin = false;
                    return [4 /*yield*/, connection.manager.save(user1)];
                case 1:
                    _a.sent();
                    user2 = new User_1.User();
                    user2.firstName = "Alex";
                    user2.lastName = "Messer";
                    user2.isAdmin = false;
                    return [4 /*yield*/, connection.manager.save(user2)];
                case 2:
                    _a.sent();
                    user3 = new User_1.User();
                    user3.firstName = "Umed";
                    user3.lastName = "Pleerock";
                    user3.isAdmin = true;
                    return [4 /*yield*/, connection.manager.save(user3)];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, connection
                            .createQueryBuilder(User_1.User, "user")
                            .where("user.isAdmin = :isAdmin", { isAdmin: true })
                            .cache(true)
                            .getCount()];
                case 4:
                    users1 = _a.sent();
                    chai_1.expect(users1).to.be.equal(1);
                    user4 = new User_1.User();
                    user4.firstName = "Bakhrom";
                    user4.lastName = "Brochik";
                    user4.isAdmin = true;
                    return [4 /*yield*/, connection.manager.save(user4)];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, connection
                            .createQueryBuilder(User_1.User, "user")
                            .where("user.isAdmin = :isAdmin", { isAdmin: true })
                            .getCount()];
                case 6:
                    users2 = _a.sent();
                    chai_1.expect(users2).to.be.equal(2);
                    return [4 /*yield*/, connection
                            .createQueryBuilder(User_1.User, "user")
                            .where("user.isAdmin = :isAdmin", { isAdmin: true })
                            .cache(true)
                            .getCount()];
                case 7:
                    users3 = _a.sent();
                    chai_1.expect(users3).to.be.equal(1);
                    // give some time for cache to expire
                    return [4 /*yield*/, test_utils_1.sleep(1000)];
                case 8:
                    // give some time for cache to expire
                    _a.sent();
                    return [4 /*yield*/, connection
                            .createQueryBuilder(User_1.User, "user")
                            .where("user.isAdmin = :isAdmin", { isAdmin: true })
                            .cache(true)
                            .getCount()];
                case 9:
                    users4 = _a.sent();
                    chai_1.expect(users4).to.be.equal(2);
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=query-builder-cache.js.map