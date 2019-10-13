"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var chai_1 = require("chai");
var test_utils_1 = require("../../../utils/test-utils");
var User_1 = require("./entity/User");
var SqlServerDriver_1 = require("../../../../src/driver/sqlserver/SqlServerDriver");
var Photo_1 = require("./entity/Photo");
var AbstractSqliteDriver_1 = require("../../../../src/driver/sqlite-abstract/AbstractSqliteDriver");
var OracleDriver_1 = require("../../../../src/driver/oracle/OracleDriver");
describe("query builder > insert", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                        dropSchema: true
                    })];
                case 1: return [2 /*return*/, connections = _a.sent()];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should perform insertion correctly", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var user, users;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    user = new User_1.User();
                    user.name = "Alex Messer";
                    return [4 /*yield*/, connection.createQueryBuilder()
                            .insert()
                            .into(User_1.User)
                            .values(user)
                            .execute()];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, connection.createQueryBuilder()
                            .insert()
                            .into(User_1.User)
                            .values({
                            name: "Dima Zotov"
                        })
                            .execute()];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, connection.getRepository(User_1.User)
                            .createQueryBuilder("user")
                            .insert()
                            .values({ name: "Muhammad Mirzoev" })
                            .execute()];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, connection.getRepository(User_1.User).find()];
                case 4:
                    users = _a.sent();
                    users.should.be.eql([
                        { id: 1, name: "Alex Messer" },
                        { id: 2, name: "Dima Zotov" },
                        { id: 3, name: "Muhammad Mirzoev" }
                    ]);
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should perform bulk insertion correctly", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var users;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    // it is skipped for Oracle because it does not support bulk insertion
                    if (connection.driver instanceof OracleDriver_1.OracleDriver)
                        return [2 /*return*/];
                    return [4 /*yield*/, connection.createQueryBuilder()
                            .insert()
                            .into(User_1.User)
                            .values([
                            { name: "Umed Khudoiberdiev" },
                            { name: "Bakhrom Baubekov" },
                            { name: "Bakhodur Kandikov" },
                        ])
                            .execute()];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, connection.getRepository(User_1.User).find()];
                case 2:
                    users = _a.sent();
                    users.should.be.eql([
                        { id: 1, name: "Umed Khudoiberdiev" },
                        { id: 2, name: "Bakhrom Baubekov" },
                        { id: 3, name: "Bakhodur Kandikov" }
                    ]);
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should be able to use sql functions", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var loadedUser1;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, connection.createQueryBuilder()
                        .insert()
                        .into(User_1.User)
                        .values({
                        name: function () { return connection.driver instanceof SqlServerDriver_1.SqlServerDriver ? "SUBSTRING('Dima Zotov', 1, 4)" : "SUBSTR('Dima Zotov', 1, 4)"; }
                    })
                        .execute()];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, connection.getRepository(User_1.User).findOne({ name: "Dima" })];
                case 2:
                    loadedUser1 = _a.sent();
                    chai_1.expect(loadedUser1).to.exist;
                    loadedUser1.name.should.be.equal("Dima");
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should be able to insert entities with different properties set even inside embeds", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var loadedPhoto1, loadedPhoto2;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    // this test is skipped for sqlite based drivers because it does not support DEFAULT values in insertions,
                    // also it is skipped for Oracle because it does not support bulk insertion
                    if (connection.driver instanceof AbstractSqliteDriver_1.AbstractSqliteDriver || connection.driver instanceof OracleDriver_1.OracleDriver)
                        return [2 /*return*/];
                    return [4 /*yield*/, connection
                            .createQueryBuilder()
                            .insert()
                            .into(Photo_1.Photo)
                            .values([{
                                url: "1.jpg",
                                counters: {
                                    likes: 1,
                                    favorites: 1,
                                    comments: 1,
                                }
                            }, {
                                url: "2.jpg"
                            }])
                            .execute()];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, connection.getRepository(Photo_1.Photo).findOne({ url: "1.jpg" })];
                case 2:
                    loadedPhoto1 = _a.sent();
                    chai_1.expect(loadedPhoto1).to.exist;
                    loadedPhoto1.should.be.eql({
                        id: 1,
                        url: "1.jpg",
                        counters: {
                            likes: 1,
                            favorites: 1,
                            comments: 1,
                        }
                    });
                    return [4 /*yield*/, connection.getRepository(Photo_1.Photo).findOne({ url: "2.jpg" })];
                case 3:
                    loadedPhoto2 = _a.sent();
                    chai_1.expect(loadedPhoto2).to.exist;
                    loadedPhoto2.should.be.eql({
                        id: 2,
                        url: "2.jpg",
                        counters: {
                            likes: 1,
                            favorites: null,
                            comments: 0,
                        }
                    });
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=query-builder-insert.js.map