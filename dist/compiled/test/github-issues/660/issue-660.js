"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var User_1 = require("./entity/User");
var SqlServerDriver_1 = require("../../../src/driver/sqlserver/SqlServerDriver");
var PostgresDriver_1 = require("../../../src/driver/postgres/PostgresDriver");
var chai_1 = require("chai");
var ReturningStatementNotSupportedError_1 = require("../../../src/error/ReturningStatementNotSupportedError");
describe("github issues > #660 Specifying a RETURNING or OUTPUT clause with QueryBuilder", function () {
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
    it("should create an INSERT statement, including RETURNING or OUTPUT clause (PostgreSQL and MSSQL only)", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var user, sql;
        return tslib_1.__generator(this, function (_a) {
            user = new User_1.User();
            user.name = "Tim Merrison";
            sql = "";
            try {
                sql = connection.createQueryBuilder()
                    .insert()
                    .into(User_1.User)
                    .values(user)
                    .returning(connection.driver instanceof PostgresDriver_1.PostgresDriver ? "*" : "inserted.*")
                    .disableEscaping()
                    .getSql();
            }
            catch (err) {
                chai_1.expect(err.message).to.eql(new ReturningStatementNotSupportedError_1.ReturningStatementNotSupportedError().message);
            }
            if (connection.driver instanceof SqlServerDriver_1.SqlServerDriver) {
                chai_1.expect(sql).to.equal("INSERT INTO user(name) OUTPUT inserted.* VALUES (@0)");
            }
            else if (connection.driver instanceof PostgresDriver_1.PostgresDriver) {
                chai_1.expect(sql).to.equal("INSERT INTO user(name) VALUES ($1) RETURNING *");
            }
            return [2 /*return*/];
        });
    }); })); });
    it("should perform insert with RETURNING or OUTPUT clause (PostgreSQL and MSSQL only)", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var user, returning;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    user = new User_1.User();
                    user.name = "Tim Merrison";
                    if (!(connection.driver instanceof SqlServerDriver_1.SqlServerDriver || connection.driver instanceof PostgresDriver_1.PostgresDriver)) return [3 /*break*/, 2];
                    return [4 /*yield*/, connection.createQueryBuilder()
                            .insert()
                            .into(User_1.User)
                            .values(user)
                            .returning(connection.driver instanceof PostgresDriver_1.PostgresDriver ? "*" : "inserted.*")
                            .execute()];
                case 1:
                    returning = _a.sent();
                    returning.raw.should.be.eql([
                        { id: 1, name: user.name }
                    ]);
                    _a.label = 2;
                case 2: return [2 /*return*/];
            }
        });
    }); })); });
    it("should create an UPDATE statement, including RETURNING or OUTPUT clause (PostgreSQL and MSSQL only)", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var user, sql;
        return tslib_1.__generator(this, function (_a) {
            user = new User_1.User();
            user.name = "Tim Merrison";
            try {
                sql = connection.createQueryBuilder()
                    .update(User_1.User)
                    .set({ name: "Joe Bloggs" })
                    .where("name = :name", { name: user.name })
                    .returning(connection.driver instanceof PostgresDriver_1.PostgresDriver ? "*" : "inserted.*")
                    .disableEscaping()
                    .getSql();
                if (connection.driver instanceof SqlServerDriver_1.SqlServerDriver) {
                    chai_1.expect(sql).to.equal("UPDATE user SET name = @0 OUTPUT inserted.* WHERE name = @1");
                }
                else if (connection.driver instanceof PostgresDriver_1.PostgresDriver) {
                    chai_1.expect(sql).to.equal("UPDATE user SET name = $1 WHERE name = $2 RETURNING *");
                }
            }
            catch (err) {
                chai_1.expect(err.message).to.eql(new ReturningStatementNotSupportedError_1.ReturningStatementNotSupportedError().message);
            }
            return [2 /*return*/];
        });
    }); })); });
    it("should perform update with RETURNING or OUTPUT clause (PostgreSQL and MSSQL only)", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var user, returning;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    user = new User_1.User();
                    user.name = "Tim Merrison";
                    return [4 /*yield*/, connection.manager.save(user)];
                case 1:
                    _a.sent();
                    if (!(connection.driver instanceof SqlServerDriver_1.SqlServerDriver || connection.driver instanceof PostgresDriver_1.PostgresDriver)) return [3 /*break*/, 3];
                    return [4 /*yield*/, connection.createQueryBuilder()
                            .update(User_1.User)
                            .set({ name: "Joe Bloggs" })
                            .where("name = :name", { name: user.name })
                            .returning(connection.driver instanceof PostgresDriver_1.PostgresDriver ? "*" : "inserted.*")
                            .execute()];
                case 2:
                    returning = _a.sent();
                    returning.raw.should.be.eql([
                        { id: 1, name: "Joe Bloggs" }
                    ]);
                    _a.label = 3;
                case 3: return [2 /*return*/];
            }
        });
    }); })); });
    it("should create a DELETE statement, including RETURNING or OUTPUT clause (PostgreSQL and MSSQL only)", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var user, sql;
        return tslib_1.__generator(this, function (_a) {
            try {
                user = new User_1.User();
                user.name = "Tim Merrison";
                sql = connection.createQueryBuilder()
                    .delete()
                    .from(User_1.User)
                    .where("name = :name", { name: user.name })
                    .returning(connection.driver instanceof PostgresDriver_1.PostgresDriver ? "*" : "deleted.*")
                    .disableEscaping()
                    .getSql();
                if (connection.driver instanceof SqlServerDriver_1.SqlServerDriver) {
                    chai_1.expect(sql).to.equal("DELETE FROM user OUTPUT deleted.* WHERE name = @0");
                }
                else if (connection.driver instanceof PostgresDriver_1.PostgresDriver) {
                    chai_1.expect(sql).to.equal("DELETE FROM user WHERE name = $1 RETURNING *");
                }
            }
            catch (err) {
                chai_1.expect(err.message).to.eql(new ReturningStatementNotSupportedError_1.ReturningStatementNotSupportedError().message);
            }
            return [2 /*return*/];
        });
    }); })); });
    it("should perform delete with RETURNING or OUTPUT clause (PostgreSQL and MSSQL only)", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var user, returning;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    user = new User_1.User();
                    user.name = "Tim Merrison";
                    return [4 /*yield*/, connection.manager.save(user)];
                case 1:
                    _a.sent();
                    if (!(connection.driver instanceof SqlServerDriver_1.SqlServerDriver || connection.driver instanceof PostgresDriver_1.PostgresDriver)) return [3 /*break*/, 3];
                    return [4 /*yield*/, connection.createQueryBuilder()
                            .delete()
                            .from(User_1.User)
                            .where("name = :name", { name: user.name })
                            .returning(connection.driver instanceof PostgresDriver_1.PostgresDriver ? "*" : "deleted.*")
                            .execute()];
                case 2:
                    returning = _a.sent();
                    returning.raw.should.be.eql([
                        { id: 1, name: user.name }
                    ]);
                    _a.label = 3;
                case 3: return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-660.js.map