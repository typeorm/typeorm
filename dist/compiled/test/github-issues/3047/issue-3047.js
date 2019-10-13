"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var chai_1 = require("chai");
var User_1 = require("./entity/User");
var MysqlDriver_1 = require("../../../src/driver/mysql/MysqlDriver");
var PostgresDriver_1 = require("../../../src/driver/postgres/PostgresDriver");
describe("github issues > #3047 Mysqsl on duplicate key update use current values", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [User_1.User],
                        schemaCreate: true,
                        dropSchema: true,
                    })];
                case 1: return [2 /*return*/, connections = _a.sent()];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    var user1 = new User_1.User();
    user1.first_name = "John";
    user1.last_name = "Lenon";
    user1.is_updated = "no";
    var user2 = new User_1.User();
    user2.first_name = "John";
    user2.last_name = "Lenon";
    user2.is_updated = "yes";
    it("should overwrite using current value in MySQL/MariaDB", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var UserRepository, loadedUser, err_1;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 5, , 6]);
                    if (!(connection.driver instanceof MysqlDriver_1.MysqlDriver)) return [3 /*break*/, 4];
                    UserRepository = connection.manager.getRepository(User_1.User);
                    return [4 /*yield*/, UserRepository
                            .createQueryBuilder()
                            .insert()
                            .into(User_1.User)
                            .values(user1)
                            .execute()];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, UserRepository
                            .createQueryBuilder()
                            .insert()
                            .into(User_1.User)
                            .values(user2)
                            .orUpdate({ overwrite: ["is_updated"] })
                            .execute()];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, UserRepository.find()];
                case 3:
                    loadedUser = _a.sent();
                    chai_1.expect(loadedUser).not.to.be.undefined;
                    chai_1.expect(loadedUser).to.have.lengthOf(1);
                    chai_1.expect(loadedUser[0]).to.includes({ is_updated: "yes" });
                    _a.label = 4;
                case 4: return [3 /*break*/, 6];
                case 5:
                    err_1 = _a.sent();
                    throw new Error(err_1);
                case 6: return [2 /*return*/];
            }
        });
    }); })); });
    it("should overwrite using current value in PostgreSQL", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var UserRepository, loadedUser, err_2;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 5, , 6]);
                    if (!(connection.driver instanceof PostgresDriver_1.PostgresDriver)) return [3 /*break*/, 4];
                    UserRepository = connection.manager.getRepository(User_1.User);
                    return [4 /*yield*/, UserRepository
                            .createQueryBuilder()
                            .insert()
                            .into(User_1.User)
                            .values(user1)
                            .execute()];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, UserRepository
                            .createQueryBuilder()
                            .insert()
                            .into(User_1.User)
                            .values(user2)
                            .orUpdate({
                            conflict_target: ["first_name", "last_name"],
                            overwrite: ["is_updated"],
                        })
                            .execute()];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, UserRepository.find()];
                case 3:
                    loadedUser = _a.sent();
                    chai_1.expect(loadedUser).not.to.be.undefined;
                    chai_1.expect(loadedUser).to.have.lengthOf(1);
                    chai_1.expect(loadedUser[0]).to.includes({ is_updated: "yes" });
                    _a.label = 4;
                case 4: return [3 /*break*/, 6];
                case 5:
                    err_2 = _a.sent();
                    throw new Error(err_2);
                case 6: return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-3047.js.map