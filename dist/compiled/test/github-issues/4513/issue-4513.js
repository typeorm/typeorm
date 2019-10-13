"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var User_1 = require("./entity/User");
describe("github issues > #4513 CockroachDB support for onConflict", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                        schemaCreate: true,
                        dropSchema: true,
                        enabledDrivers: ["cockroachdb"]
                    })];
                case 1: return [2 /*return*/, connections = _a.sent()];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should insert if no conflict", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var user1, user2;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    user1 = new User_1.User();
                    user1.name = "example";
                    user1.email = "example@example.com";
                    user1.age = 30;
                    return [4 /*yield*/, connection.createQueryBuilder()
                            .insert()
                            .into(User_1.User)
                            .values(user1)
                            .execute()];
                case 1:
                    _a.sent();
                    user2 = new User_1.User();
                    user2.name = "example2";
                    user2.email = "example2@example.com";
                    user2.age = 42;
                    return [4 /*yield*/, connection.createQueryBuilder()
                            .insert()
                            .into(User_1.User)
                            .values(user2)
                            .onConflict("(\"name\", \"email\") DO NOTHING")
                            .execute()];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, connection.manager.find(User_1.User).should.eventually.have.lengthOf(2)];
                case 3:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should update on conflict with do update", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var user1, user2;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    user1 = new User_1.User();
                    user1.name = "example";
                    user1.email = "example@example.com";
                    user1.age = 30;
                    return [4 /*yield*/, connection.createQueryBuilder()
                            .insert()
                            .into(User_1.User)
                            .values(user1)
                            .execute()];
                case 1:
                    _a.sent();
                    user2 = new User_1.User();
                    user2.name = "example";
                    user2.email = "example@example.com";
                    user2.age = 42;
                    return [4 /*yield*/, connection.createQueryBuilder()
                            .insert()
                            .into(User_1.User)
                            .values(user2)
                            .onConflict("(\"name\", \"email\") DO UPDATE SET age = EXCLUDED.age")
                            .execute()];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, connection.manager.findOne(User_1.User, { name: "example", email: "example@example.com" }).should.eventually.be.eql({
                            name: "example",
                            email: "example@example.com",
                            age: 42,
                        })];
                case 3:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should not update on conflict with do nothing", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var user1, user2;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    user1 = new User_1.User();
                    user1.name = "example";
                    user1.email = "example@example.com";
                    user1.age = 30;
                    return [4 /*yield*/, connection.createQueryBuilder()
                            .insert()
                            .into(User_1.User)
                            .values(user1)
                            .execute()];
                case 1:
                    _a.sent();
                    user2 = new User_1.User();
                    user2.name = "example";
                    user2.email = "example@example.com";
                    user2.age = 42;
                    return [4 /*yield*/, connection.createQueryBuilder()
                            .insert()
                            .into(User_1.User)
                            .values(user2)
                            .onConflict("(\"name\", \"email\") DO NOTHING")
                            .execute()];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, connection.manager.findOne(User_1.User, { name: "example", email: "example@example.com" }).should.eventually.be.eql({
                            name: "example",
                            email: "example@example.com",
                            age: 30,
                        })];
                case 3:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should update with orUpdate", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var user1, user2;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    user1 = new User_1.User();
                    user1.name = "example";
                    user1.email = "example@example.com";
                    user1.age = 30;
                    return [4 /*yield*/, connection.createQueryBuilder()
                            .insert()
                            .into(User_1.User)
                            .values(user1)
                            .execute()];
                case 1:
                    _a.sent();
                    user2 = new User_1.User();
                    user2.name = "example";
                    user2.email = "example@example.com";
                    user2.age = 42;
                    return [4 /*yield*/, connection.createQueryBuilder()
                            .insert()
                            .into(User_1.User)
                            .values(user2)
                            .orUpdate({
                            conflict_target: ["name", "email"],
                            overwrite: ["age"],
                        })
                            .execute()];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, connection.manager.findOne(User_1.User, { name: "example", email: "example@example.com" }).should.eventually.be.eql({
                            name: "example",
                            email: "example@example.com",
                            age: 42,
                        })];
                case 3:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-4513.js.map