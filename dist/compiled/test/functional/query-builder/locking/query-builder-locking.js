"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var CockroachDriver_1 = require("../../../../src/driver/cockroachdb/CockroachDriver");
var test_utils_1 = require("../../../utils/test-utils");
var PostWithVersion_1 = require("./entity/PostWithVersion");
var chai_1 = require("chai");
var PostWithoutVersionAndUpdateDate_1 = require("./entity/PostWithoutVersionAndUpdateDate");
var PostWithUpdateDate_1 = require("./entity/PostWithUpdateDate");
var PostWithVersionAndUpdatedDate_1 = require("./entity/PostWithVersionAndUpdatedDate");
var OptimisticLockVersionMismatchError_1 = require("../../../../src/error/OptimisticLockVersionMismatchError");
var OptimisticLockCanNotBeUsedError_1 = require("../../../../src/error/OptimisticLockCanNotBeUsedError");
var NoVersionOrUpdateDateColumnError_1 = require("../../../../src/error/NoVersionOrUpdateDateColumnError");
var PessimisticLockTransactionRequiredError_1 = require("../../../../src/error/PessimisticLockTransactionRequiredError");
var MysqlDriver_1 = require("../../../../src/driver/mysql/MysqlDriver");
var PostgresDriver_1 = require("../../../../src/driver/postgres/PostgresDriver");
var SqlServerDriver_1 = require("../../../../src/driver/sqlserver/SqlServerDriver");
var AbstractSqliteDriver_1 = require("../../../../src/driver/sqlite-abstract/AbstractSqliteDriver");
var OracleDriver_1 = require("../../../../src/driver/oracle/OracleDriver");
var LockNotSupportedOnGivenDriverError_1 = require("../../../../src/error/LockNotSupportedOnGivenDriverError");
describe("query builder > locking", function () {
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
    it("should not attach pessimistic read lock statement on query if locking is not used", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var sql;
        return tslib_1.__generator(this, function (_a) {
            if (connection.driver instanceof AbstractSqliteDriver_1.AbstractSqliteDriver)
                return [2 /*return*/];
            sql = connection.createQueryBuilder(PostWithVersion_1.PostWithVersion, "post")
                .where("post.id = :id", { id: 1 })
                .getSql();
            chai_1.expect(sql.indexOf("LOCK IN SHARE MODE") === -1).to.be.true;
            chai_1.expect(sql.indexOf("FOR SHARE") === -1).to.be.true;
            chai_1.expect(sql.indexOf("WITH (HOLDLOCK, ROWLOCK)") === -1).to.be.true;
            return [2 /*return*/];
        });
    }); })); });
    it("should throw error if pessimistic lock used without transaction", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            if (connection.driver instanceof AbstractSqliteDriver_1.AbstractSqliteDriver)
                return [2 /*return*/];
            return [2 /*return*/, Promise.all([
                    connection.createQueryBuilder(PostWithVersion_1.PostWithVersion, "post")
                        .setLock("pessimistic_read")
                        .where("post.id = :id", { id: 1 })
                        .getOne().should.be.rejectedWith(PessimisticLockTransactionRequiredError_1.PessimisticLockTransactionRequiredError),
                    connection.createQueryBuilder(PostWithVersion_1.PostWithVersion, "post")
                        .setLock("pessimistic_write")
                        .where("post.id = :id", { id: 1 })
                        .getOne().should.be.rejectedWith(PessimisticLockTransactionRequiredError_1.PessimisticLockTransactionRequiredError)
                ])];
        });
    }); })); });
    it("should not throw error if pessimistic lock used with transaction", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            if (connection.driver instanceof AbstractSqliteDriver_1.AbstractSqliteDriver || connection.driver instanceof CockroachDriver_1.CockroachDriver)
                return [2 /*return*/];
            return [2 /*return*/, connection.manager.transaction(function (entityManager) {
                    return Promise.all([
                        entityManager.createQueryBuilder(PostWithVersion_1.PostWithVersion, "post")
                            .setLock("pessimistic_read")
                            .where("post.id = :id", { id: 1 })
                            .getOne().should.not.be.rejected,
                        entityManager.createQueryBuilder(PostWithVersion_1.PostWithVersion, "post")
                            .setLock("pessimistic_write")
                            .where("post.id = :id", { id: 1 })
                            .getOne().should.not.be.rejected
                    ]);
                })];
        });
    }); })); });
    it("should attach pessimistic read lock statement on query if locking enabled", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var sql;
        return tslib_1.__generator(this, function (_a) {
            if (connection.driver instanceof AbstractSqliteDriver_1.AbstractSqliteDriver || connection.driver instanceof CockroachDriver_1.CockroachDriver)
                return [2 /*return*/];
            sql = connection.createQueryBuilder(PostWithVersion_1.PostWithVersion, "post")
                .setLock("pessimistic_read")
                .where("post.id = :id", { id: 1 })
                .getSql();
            if (connection.driver instanceof MysqlDriver_1.MysqlDriver) {
                chai_1.expect(sql.indexOf("LOCK IN SHARE MODE") !== -1).to.be.true;
            }
            else if (connection.driver instanceof PostgresDriver_1.PostgresDriver) {
                chai_1.expect(sql.indexOf("FOR SHARE") !== -1).to.be.true;
            }
            else if (connection.driver instanceof OracleDriver_1.OracleDriver) {
                chai_1.expect(sql.indexOf("FOR UPDATE") !== -1).to.be.true;
            }
            else if (connection.driver instanceof SqlServerDriver_1.SqlServerDriver) {
                chai_1.expect(sql.indexOf("WITH (HOLDLOCK, ROWLOCK)") !== -1).to.be.true;
            }
            return [2 /*return*/];
        });
    }); })); });
    it("should attach dirty read lock statement on query if locking enabled", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var sql;
        return tslib_1.__generator(this, function (_a) {
            if (!(connection.driver instanceof SqlServerDriver_1.SqlServerDriver))
                return [2 /*return*/];
            sql = connection.createQueryBuilder(PostWithVersion_1.PostWithVersion, "post")
                .setLock("dirty_read")
                .where("post.id = :id", { id: 1 })
                .getSql();
            chai_1.expect(sql.indexOf("WITH (NOLOCK)") !== -1).to.be.true;
            return [2 /*return*/];
        });
    }); })); });
    it("should not attach pessimistic write lock statement on query if locking is not used", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var sql;
        return tslib_1.__generator(this, function (_a) {
            if (connection.driver instanceof AbstractSqliteDriver_1.AbstractSqliteDriver)
                return [2 /*return*/];
            sql = connection.createQueryBuilder(PostWithVersion_1.PostWithVersion, "post")
                .where("post.id = :id", { id: 1 })
                .getSql();
            chai_1.expect(sql.indexOf("FOR UPDATE") === -1).to.be.true;
            chai_1.expect(sql.indexOf("WITH (UPDLOCK, ROWLOCK)") === -1).to.be.true;
            return [2 /*return*/];
        });
    }); })); });
    it("should attach pessimistic write lock statement on query if locking enabled", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var sql;
        return tslib_1.__generator(this, function (_a) {
            if (connection.driver instanceof AbstractSqliteDriver_1.AbstractSqliteDriver || connection.driver instanceof CockroachDriver_1.CockroachDriver)
                return [2 /*return*/];
            sql = connection.createQueryBuilder(PostWithVersion_1.PostWithVersion, "post")
                .setLock("pessimistic_write")
                .where("post.id = :id", { id: 1 })
                .getSql();
            if (connection.driver instanceof MysqlDriver_1.MysqlDriver || connection.driver instanceof PostgresDriver_1.PostgresDriver || connection.driver instanceof OracleDriver_1.OracleDriver) {
                chai_1.expect(sql.indexOf("FOR UPDATE") !== -1).to.be.true;
            }
            else if (connection.driver instanceof SqlServerDriver_1.SqlServerDriver) {
                chai_1.expect(sql.indexOf("WITH (UPDLOCK, ROWLOCK)") !== -1).to.be.true;
            }
            return [2 /*return*/];
        });
    }); })); });
    it("should throw error if optimistic lock used with getMany method", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            return [2 /*return*/, connection.createQueryBuilder(PostWithVersion_1.PostWithVersion, "post")
                    .setLock("optimistic", 1)
                    .getMany().should.be.rejectedWith(OptimisticLockCanNotBeUsedError_1.OptimisticLockCanNotBeUsedError)];
        });
    }); })); });
    it("should throw error if optimistic lock used with getCount method", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            return [2 /*return*/, connection.createQueryBuilder(PostWithVersion_1.PostWithVersion, "post")
                    .setLock("optimistic", 1)
                    .getCount().should.be.rejectedWith(OptimisticLockCanNotBeUsedError_1.OptimisticLockCanNotBeUsedError)];
        });
    }); })); });
    it("should throw error if optimistic lock used with getManyAndCount method", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            return [2 /*return*/, connection.createQueryBuilder(PostWithVersion_1.PostWithVersion, "post")
                    .setLock("optimistic", 1)
                    .getManyAndCount().should.be.rejectedWith(OptimisticLockCanNotBeUsedError_1.OptimisticLockCanNotBeUsedError)];
        });
    }); })); });
    it("should throw error if optimistic lock used with getRawMany method", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            return [2 /*return*/, connection.createQueryBuilder(PostWithVersion_1.PostWithVersion, "post")
                    .setLock("optimistic", 1)
                    .getRawMany().should.be.rejectedWith(OptimisticLockCanNotBeUsedError_1.OptimisticLockCanNotBeUsedError)];
        });
    }); })); });
    it("should throw error if optimistic lock used with getRawOne method", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            return [2 /*return*/, connection.createQueryBuilder(PostWithVersion_1.PostWithVersion, "post")
                    .setLock("optimistic", 1)
                    .where("post.id = :id", { id: 1 })
                    .getRawOne().should.be.rejectedWith(OptimisticLockCanNotBeUsedError_1.OptimisticLockCanNotBeUsedError)];
        });
    }); })); });
    it("should not throw error if optimistic lock used with getOne method", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            return [2 /*return*/, connection.createQueryBuilder(PostWithVersion_1.PostWithVersion, "post")
                    .setLock("optimistic", 1)
                    .where("post.id = :id", { id: 1 })
                    .getOne().should.not.be.rejected];
        });
    }); })); });
    it.skip("should throw error if entity does not have version and update date columns", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var post;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    post = new PostWithoutVersionAndUpdateDate_1.PostWithoutVersionAndUpdateDate();
                    post.title = "New post";
                    return [4 /*yield*/, connection.manager.save(post)];
                case 1:
                    _a.sent();
                    return [2 /*return*/, connection.createQueryBuilder(PostWithoutVersionAndUpdateDate_1.PostWithoutVersionAndUpdateDate, "post")
                            .setLock("optimistic", 1)
                            .where("post.id = :id", { id: 1 })
                            .getOne().should.be.rejectedWith(NoVersionOrUpdateDateColumnError_1.NoVersionOrUpdateDateColumnError)];
            }
        });
    }); })); });
    // skipped because inserted milliseconds are not always equal to what we say it to insert, unskip when needed
    it.skip("should throw error if actual version does not equal expected version", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var post;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    post = new PostWithVersion_1.PostWithVersion();
                    post.title = "New post";
                    return [4 /*yield*/, connection.manager.save(post)];
                case 1:
                    _a.sent();
                    return [2 /*return*/, connection.createQueryBuilder(PostWithVersion_1.PostWithVersion, "post")
                            .setLock("optimistic", 2)
                            .where("post.id = :id", { id: 1 })
                            .getOne().should.be.rejectedWith(OptimisticLockVersionMismatchError_1.OptimisticLockVersionMismatchError)];
            }
        });
    }); })); });
    // skipped because inserted milliseconds are not always equal to what we say it to insert, unskip when needed
    it.skip("should not throw error if actual version and expected versions are equal", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var post;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    post = new PostWithVersion_1.PostWithVersion();
                    post.title = "New post";
                    return [4 /*yield*/, connection.manager.save(post)];
                case 1:
                    _a.sent();
                    return [2 /*return*/, connection.createQueryBuilder(PostWithVersion_1.PostWithVersion, "post")
                            .setLock("optimistic", 1)
                            .where("post.id = :id", { id: 1 })
                            .getOne().should.not.be.rejected];
            }
        });
    }); })); });
    // skipped because inserted milliseconds are not always equal to what we say it to insert, unskip when needed
    it.skip("should throw error if actual updated date does not equal expected updated date", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var post;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    post = new PostWithUpdateDate_1.PostWithUpdateDate();
                    post.title = "New post";
                    return [4 /*yield*/, connection.manager.save(post)];
                case 1:
                    _a.sent();
                    return [2 /*return*/, connection.createQueryBuilder(PostWithUpdateDate_1.PostWithUpdateDate, "post")
                            .setLock("optimistic", new Date(2017, 1, 1))
                            .where("post.id = :id", { id: 1 })
                            .getOne().should.be.rejectedWith(OptimisticLockVersionMismatchError_1.OptimisticLockVersionMismatchError)];
            }
        });
    }); })); });
    // skipped because inserted milliseconds are not always equal to what we say it to insert, unskip when needed
    it.skip("should not throw error if actual updated date and expected updated date are equal", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var post;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (connection.driver instanceof SqlServerDriver_1.SqlServerDriver)
                        return [2 /*return*/];
                    post = new PostWithUpdateDate_1.PostWithUpdateDate();
                    post.title = "New post";
                    return [4 /*yield*/, connection.manager.save(post)];
                case 1:
                    _a.sent();
                    return [2 /*return*/, connection.createQueryBuilder(PostWithUpdateDate_1.PostWithUpdateDate, "post")
                            .setLock("optimistic", post.updateDate)
                            .where("post.id = :id", { id: 1 })
                            .getOne().should.not.be.rejected];
            }
        });
    }); })); });
    // skipped because inserted milliseconds are not always equal to what we say it to insert, unskip when needed
    it.skip("should work if both version and update date columns applied", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var post;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    post = new PostWithVersionAndUpdatedDate_1.PostWithVersionAndUpdatedDate();
                    post.title = "New post";
                    return [4 /*yield*/, connection.manager.save(post)];
                case 1:
                    _a.sent();
                    return [2 /*return*/, Promise.all([
                            connection.createQueryBuilder(PostWithVersionAndUpdatedDate_1.PostWithVersionAndUpdatedDate, "post")
                                .setLock("optimistic", post.updateDate)
                                .where("post.id = :id", { id: 1 })
                                .getOne().should.not.be.rejected,
                            connection.createQueryBuilder(PostWithVersionAndUpdatedDate_1.PostWithVersionAndUpdatedDate, "post")
                                .setLock("optimistic", 1)
                                .where("post.id = :id", { id: 1 })
                                .getOne().should.not.be.rejected
                        ])];
            }
        });
    }); })); });
    it("should throw error if pessimistic locking not supported by given driver", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            if (connection.driver instanceof AbstractSqliteDriver_1.AbstractSqliteDriver || connection.driver instanceof CockroachDriver_1.CockroachDriver)
                return [2 /*return*/, connection.manager.transaction(function (entityManager) {
                        return Promise.all([
                            entityManager.createQueryBuilder(PostWithVersion_1.PostWithVersion, "post")
                                .setLock("pessimistic_read")
                                .where("post.id = :id", { id: 1 })
                                .getOne().should.be.rejectedWith(LockNotSupportedOnGivenDriverError_1.LockNotSupportedOnGivenDriverError),
                            entityManager.createQueryBuilder(PostWithVersion_1.PostWithVersion, "post")
                                .setLock("pessimistic_write")
                                .where("post.id = :id", { id: 1 })
                                .getOne().should.be.rejectedWith(LockNotSupportedOnGivenDriverError_1.LockNotSupportedOnGivenDriverError)
                        ]);
                    })];
            return [2 /*return*/];
        });
    }); })); });
});
//# sourceMappingURL=query-builder-locking.js.map