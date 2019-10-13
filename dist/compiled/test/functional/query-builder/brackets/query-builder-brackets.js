"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var chai_1 = require("chai");
var test_utils_1 = require("../../../utils/test-utils");
var User_1 = require("./entity/User");
var Brackets_1 = require("../../../../src/query-builder/Brackets");
describe("query builder > brackets", function () {
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
    it("should put brackets correctly into WHERE expression", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var user1, user2, user3, users;
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
                    return [4 /*yield*/, connection.createQueryBuilder(User_1.User, "user")
                            .where("user.isAdmin = :isAdmin", { isAdmin: true })
                            .orWhere(new Brackets_1.Brackets(function (qb) {
                            qb.where("user.firstName = :firstName1", { firstName1: "Timber" })
                                .andWhere("user.lastName = :lastName1", { lastName1: "Saw" });
                        }))
                            .orWhere(new Brackets_1.Brackets(function (qb) {
                            qb.where("user.firstName = :firstName2", { firstName2: "Alex" })
                                .andWhere("user.lastName = :lastName2", { lastName2: "Messer" });
                        }))
                            .getMany()];
                case 4:
                    users = _a.sent();
                    chai_1.expect(users.length).to.be.equal(3);
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=query-builder-brackets.js.map