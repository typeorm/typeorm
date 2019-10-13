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
describe("github issues > #1780 Support for insertion ignore on duplicate error", function () {
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
    // let data = [user1, user2];
    // Bulk insertion with duplicated data through same query with duplicate error exception is not supported in PostgreSQL
    // https://doxygen.postgresql.org/nodeModifyTable_8c_source.html : Line 1356
    it("should save one row without duplicate error in MySQL/MariaDB", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var UserRepository, loadedUser_1, loadedUser_2, loadedUser_3, err_1;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 10, , 11]);
                    if (!(connection.driver instanceof MysqlDriver_1.MysqlDriver)) return [3 /*break*/, 9];
                    UserRepository = connection.manager.getRepository(User_1.User);
                    // ignore while insertion duplicated row
                    return [4 /*yield*/, UserRepository
                            .createQueryBuilder()
                            .insert()
                            .orIgnore()
                            .into(User_1.User)
                            .values(user1)
                            .execute()];
                case 1:
                    // ignore while insertion duplicated row
                    _a.sent();
                    return [4 /*yield*/, UserRepository
                            .createQueryBuilder()
                            .insert()
                            .orIgnore()
                            .into(User_1.User)
                            .values(user2)
                            .execute()];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, UserRepository.find()];
                case 3:
                    loadedUser_1 = _a.sent();
                    chai_1.expect(loadedUser_1).not.to.be.eql([]);
                    loadedUser_1.length.should.be.equal(1);
                    // remove all rows
                    return [4 /*yield*/, UserRepository.remove(loadedUser_1)];
                case 4:
                    // remove all rows
                    _a.sent();
                    return [4 /*yield*/, UserRepository.find()];
                case 5:
                    loadedUser_2 = _a.sent();
                    chai_1.expect(loadedUser_2).to.be.eql([]);
                    // update while insertion duplicated row
                    return [4 /*yield*/, UserRepository
                            .createQueryBuilder()
                            .insert()
                            .orUpdate({ columns: ["is_updated"] })
                            .setParameter("is_updated", user1.is_updated)
                            .into(User_1.User)
                            .values(user1)
                            .execute()];
                case 6:
                    // update while insertion duplicated row
                    _a.sent();
                    return [4 /*yield*/, UserRepository
                            .createQueryBuilder()
                            .insert()
                            .orUpdate({ columns: ["is_updated"] })
                            .setParameter("is_updated", user2.is_updated)
                            .into(User_1.User)
                            .values(user2)
                            .execute()];
                case 7:
                    _a.sent();
                    return [4 /*yield*/, UserRepository.find()];
                case 8:
                    loadedUser_3 = _a.sent();
                    chai_1.expect(loadedUser_3).not.to.be.eql([]);
                    loadedUser_3.length.should.be.equal(1);
                    chai_1.expect(loadedUser_3[0]).to.deep.include({ first_name: "John", last_name: "Lenon", is_updated: "yes" });
                    _a.label = 9;
                case 9: return [3 /*break*/, 11];
                case 10:
                    err_1 = _a.sent();
                    throw new Error(err_1);
                case 11: return [2 /*return*/];
            }
        });
    }); })); });
    it("should save one row without duplicate error in PostgreSQL", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var UserRepository, loadedUser_1, loadedUser_2, loadedUser_3, loadedUser_4, loadedUser_5, err_2;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 16, , 17]);
                    if (!(connection.driver instanceof PostgresDriver_1.PostgresDriver)) return [3 /*break*/, 15];
                    UserRepository = connection.manager.getRepository(User_1.User);
                    // ignore while insertion duplicated row
                    return [4 /*yield*/, UserRepository
                            .createQueryBuilder()
                            .insert()
                            .orIgnore()
                            .into(User_1.User)
                            .values(user1)
                            .execute()];
                case 1:
                    // ignore while insertion duplicated row
                    _a.sent();
                    return [4 /*yield*/, UserRepository
                            .createQueryBuilder()
                            .insert()
                            .orIgnore()
                            .into(User_1.User)
                            .values(user2)
                            .execute()];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, UserRepository.find()];
                case 3:
                    loadedUser_1 = _a.sent();
                    chai_1.expect(loadedUser_1).not.to.be.eql([]);
                    loadedUser_1.length.should.be.equal(1);
                    // remove all rows
                    return [4 /*yield*/, UserRepository.remove(loadedUser_1)];
                case 4:
                    // remove all rows
                    _a.sent();
                    return [4 /*yield*/, UserRepository.find()];
                case 5:
                    loadedUser_2 = _a.sent();
                    chai_1.expect(loadedUser_2).to.be.eql([]);
                    // update while insertion duplicated row via unique columns
                    return [4 /*yield*/, UserRepository
                            .createQueryBuilder()
                            .insert()
                            .orUpdate({ columns: ["is_updated"], conflict_target: ["first_name", "last_name"] })
                            .setParameter("is_updated", user1.is_updated)
                            .into(User_1.User)
                            .values(user1)
                            .execute()];
                case 6:
                    // update while insertion duplicated row via unique columns
                    _a.sent();
                    return [4 /*yield*/, UserRepository
                            .createQueryBuilder()
                            .insert()
                            .orUpdate({ columns: ["is_updated"], conflict_target: ["first_name", "last_name"] })
                            .setParameter("is_updated", user2.is_updated)
                            .into(User_1.User)
                            .values(user2)
                            .execute()];
                case 7:
                    _a.sent();
                    return [4 /*yield*/, UserRepository.find()];
                case 8:
                    loadedUser_3 = _a.sent();
                    chai_1.expect(loadedUser_3).not.to.be.eql([]);
                    loadedUser_3.length.should.be.equal(1);
                    chai_1.expect(loadedUser_3[0]).to.deep.include({ first_name: "John", last_name: "Lenon", is_updated: "yes" });
                    // create unique constraint
                    return [4 /*yield*/, connection.manager.query("ALTER TABLE \"user\" ADD CONSTRAINT constraint_unique_idx UNIQUE USING INDEX unique_idx;")];
                case 9:
                    // create unique constraint
                    _a.sent();
                    return [4 /*yield*/, UserRepository.remove(loadedUser_3)];
                case 10:
                    _a.sent();
                    return [4 /*yield*/, UserRepository.find()];
                case 11:
                    loadedUser_4 = _a.sent();
                    chai_1.expect(loadedUser_4).to.be.eql([]);
                    // update while insertion duplicated row via unique's constraint name
                    return [4 /*yield*/, UserRepository
                            .createQueryBuilder()
                            .insert()
                            .orUpdate({ columns: ["is_updated"], conflict_target: "constraint_unique_idx" })
                            .setParameter("is_updated", user1.is_updated)
                            .into(User_1.User)
                            .values(user1)
                            .execute()];
                case 12:
                    // update while insertion duplicated row via unique's constraint name
                    _a.sent();
                    return [4 /*yield*/, UserRepository
                            .createQueryBuilder()
                            .insert()
                            .orUpdate({ columns: ["is_updated"], conflict_target: "constraint_unique_idx" })
                            .setParameter("is_updated", user2.is_updated)
                            .into(User_1.User)
                            .values(user2)
                            .execute()];
                case 13:
                    _a.sent();
                    return [4 /*yield*/, UserRepository.find()];
                case 14:
                    loadedUser_5 = _a.sent();
                    chai_1.expect(loadedUser_5).not.to.be.eql([]);
                    loadedUser_5.length.should.be.equal(1);
                    chai_1.expect(loadedUser_3[0]).to.deep.include({ first_name: "John", last_name: "Lenon", is_updated: "yes" });
                    _a.label = 15;
                case 15: return [3 /*break*/, 17];
                case 16:
                    err_2 = _a.sent();
                    throw new Error(err_2);
                case 17: return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-1780.js.map