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
describe("repository > find options > locking", function () {
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
    it("should throw error if pessimistic lock used without transaction", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            if (connection.driver instanceof AbstractSqliteDriver_1.AbstractSqliteDriver || connection.driver instanceof CockroachDriver_1.CockroachDriver)
                return [2 /*return*/];
            return [2 /*return*/, Promise.all([
                    connection
                        .getRepository(PostWithVersion_1.PostWithVersion)
                        .findOne(1, { lock: { mode: "pessimistic_read" } })
                        .should.be.rejectedWith(PessimisticLockTransactionRequiredError_1.PessimisticLockTransactionRequiredError),
                    connection
                        .getRepository(PostWithVersion_1.PostWithVersion)
                        .findOne(1, { lock: { mode: "pessimistic_write" } })
                        .should.be.rejectedWith(PessimisticLockTransactionRequiredError_1.PessimisticLockTransactionRequiredError),
                ])];
        });
    }); })); });
    it("should not throw error if pessimistic lock used with transaction", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            if (connection.driver instanceof AbstractSqliteDriver_1.AbstractSqliteDriver || connection.driver instanceof CockroachDriver_1.CockroachDriver)
                return [2 /*return*/];
            return [2 /*return*/, connection.manager.transaction(function (entityManager) {
                    return Promise.all([
                        entityManager
                            .getRepository(PostWithVersion_1.PostWithVersion)
                            .findOne(1, { lock: { mode: "pessimistic_read" } })
                            .should.not.be.rejected,
                        entityManager
                            .getRepository(PostWithVersion_1.PostWithVersion)
                            .findOne(1, { lock: { mode: "pessimistic_write" } })
                            .should.not.be.rejected
                    ]);
                })];
        });
    }); })); });
    it("should attach pessimistic read lock statement on query if locking enabled", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var executedSql;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (connection.driver instanceof AbstractSqliteDriver_1.AbstractSqliteDriver || connection.driver instanceof CockroachDriver_1.CockroachDriver)
                        return [2 /*return*/];
                    executedSql = [];
                    return [4 /*yield*/, connection.manager.transaction(function (entityManager) {
                            var originalQuery = entityManager.queryRunner.query.bind(entityManager.queryRunner);
                            entityManager.queryRunner.query = function () {
                                var args = [];
                                for (var _i = 0; _i < arguments.length; _i++) {
                                    args[_i] = arguments[_i];
                                }
                                executedSql.push(args[0]);
                                return originalQuery.apply(void 0, tslib_1.__spread(args));
                            };
                            return entityManager
                                .getRepository(PostWithVersion_1.PostWithVersion)
                                .findOne(1, { lock: { mode: "pessimistic_read" } });
                        })];
                case 1:
                    _a.sent();
                    if (connection.driver instanceof MysqlDriver_1.MysqlDriver) {
                        chai_1.expect(executedSql[0].indexOf("LOCK IN SHARE MODE") !== -1).to.be.true;
                    }
                    else if (connection.driver instanceof PostgresDriver_1.PostgresDriver) {
                        chai_1.expect(executedSql[0].indexOf("FOR SHARE") !== -1).to.be.true;
                    }
                    else if (connection.driver instanceof OracleDriver_1.OracleDriver) {
                        chai_1.expect(executedSql[0].indexOf("FOR UPDATE") !== -1).to.be.true;
                    }
                    else if (connection.driver instanceof SqlServerDriver_1.SqlServerDriver) {
                        chai_1.expect(executedSql[0].indexOf("WITH (HOLDLOCK, ROWLOCK)") !== -1).to.be.true;
                    }
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should attach pessimistic write lock statement on query if locking enabled", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var executedSql;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (connection.driver instanceof AbstractSqliteDriver_1.AbstractSqliteDriver || connection.driver instanceof CockroachDriver_1.CockroachDriver)
                        return [2 /*return*/];
                    executedSql = [];
                    return [4 /*yield*/, connection.manager.transaction(function (entityManager) {
                            var originalQuery = entityManager.queryRunner.query.bind(entityManager.queryRunner);
                            entityManager.queryRunner.query = function () {
                                var args = [];
                                for (var _i = 0; _i < arguments.length; _i++) {
                                    args[_i] = arguments[_i];
                                }
                                executedSql.push(args[0]);
                                return originalQuery.apply(void 0, tslib_1.__spread(args));
                            };
                            return entityManager
                                .getRepository(PostWithVersion_1.PostWithVersion)
                                .findOne(1, { lock: { mode: "pessimistic_write" } });
                        })];
                case 1:
                    _a.sent();
                    if (connection.driver instanceof MysqlDriver_1.MysqlDriver || connection.driver instanceof PostgresDriver_1.PostgresDriver || connection.driver instanceof OracleDriver_1.OracleDriver) {
                        chai_1.expect(executedSql[0].indexOf("FOR UPDATE") !== -1).to.be.true;
                    }
                    else if (connection.driver instanceof SqlServerDriver_1.SqlServerDriver) {
                        chai_1.expect(executedSql[0].indexOf("WITH (UPDLOCK, ROWLOCK)") !== -1).to.be.true;
                    }
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should attach dirty read lock statement on query if locking enabled", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var executedSql;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!(connection.driver instanceof SqlServerDriver_1.SqlServerDriver))
                        return [2 /*return*/];
                    executedSql = [];
                    return [4 /*yield*/, connection.manager.transaction(function (entityManager) {
                            var originalQuery = entityManager.queryRunner.query.bind(entityManager.queryRunner);
                            entityManager.queryRunner.query = function () {
                                var args = [];
                                for (var _i = 0; _i < arguments.length; _i++) {
                                    args[_i] = arguments[_i];
                                }
                                executedSql.push(args[0]);
                                return originalQuery.apply(void 0, tslib_1.__spread(args));
                            };
                            return entityManager
                                .getRepository(PostWithVersion_1.PostWithVersion)
                                .findOne(1, { lock: { mode: "dirty_read" } });
                        })];
                case 1:
                    _a.sent();
                    chai_1.expect(executedSql[0].indexOf("WITH (NOLOCK)") !== -1).to.be.true;
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should throw error if optimistic lock used with `find` method", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            return [2 /*return*/, connection
                    .getRepository(PostWithVersion_1.PostWithVersion)
                    .find({ lock: { mode: "optimistic", version: 1 } })
                    .should.be.rejectedWith(OptimisticLockCanNotBeUsedError_1.OptimisticLockCanNotBeUsedError)];
        });
    }); })); });
    it("should not throw error if optimistic lock used with `findOne` method", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            return [2 /*return*/, connection
                    .getRepository(PostWithVersion_1.PostWithVersion)
                    .findOne(1, { lock: { mode: "optimistic", version: 1 } })
                    .should.not.be.rejected];
        });
    }); })); });
    it("should throw error if entity does not have version and update date columns", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var post;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    post = new PostWithoutVersionAndUpdateDate_1.PostWithoutVersionAndUpdateDate();
                    post.title = "New post";
                    return [4 /*yield*/, connection.manager.save(post)];
                case 1:
                    _a.sent();
                    return [2 /*return*/, connection
                            .getRepository(PostWithoutVersionAndUpdateDate_1.PostWithoutVersionAndUpdateDate)
                            .findOne(1, { lock: { mode: "optimistic", version: 1 } })
                            .should.be.rejectedWith(NoVersionOrUpdateDateColumnError_1.NoVersionOrUpdateDateColumnError)];
            }
        });
    }); })); });
    it("should throw error if actual version does not equal expected version", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var post;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    post = new PostWithVersion_1.PostWithVersion();
                    post.title = "New post";
                    return [4 /*yield*/, connection.manager.save(post)];
                case 1:
                    _a.sent();
                    return [2 /*return*/, connection
                            .getRepository(PostWithVersion_1.PostWithVersion)
                            .findOne(1, { lock: { mode: "optimistic", version: 2 } })
                            .should.be.rejectedWith(OptimisticLockVersionMismatchError_1.OptimisticLockVersionMismatchError)];
            }
        });
    }); })); });
    it("should not throw error if actual version and expected versions are equal", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var post;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    post = new PostWithVersion_1.PostWithVersion();
                    post.title = "New post";
                    return [4 /*yield*/, connection.manager.save(post)];
                case 1:
                    _a.sent();
                    return [2 /*return*/, connection
                            .getRepository(PostWithVersion_1.PostWithVersion)
                            .findOne(1, { lock: { mode: "optimistic", version: 1 } })
                            .should.not.be.rejected];
            }
        });
    }); })); });
    it("should throw error if actual updated date does not equal expected updated date", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var post;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    // skipped because inserted milliseconds are not always equal to what we say it to insert, unskip when needed
                    if (connection.driver instanceof SqlServerDriver_1.SqlServerDriver)
                        return [2 /*return*/];
                    post = new PostWithUpdateDate_1.PostWithUpdateDate();
                    post.title = "New post";
                    return [4 /*yield*/, connection.manager.save(post)];
                case 1:
                    _a.sent();
                    return [2 /*return*/, connection
                            .getRepository(PostWithUpdateDate_1.PostWithUpdateDate)
                            .findOne(1, { lock: { mode: "optimistic", version: new Date(2017, 1, 1) } })
                            .should.be.rejectedWith(OptimisticLockVersionMismatchError_1.OptimisticLockVersionMismatchError)];
            }
        });
    }); })); });
    it("should not throw error if actual updated date and expected updated date are equal", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var post;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    // skipped because inserted milliseconds are not always equal to what we say it to insert, unskip when needed
                    if (connection.driver instanceof SqlServerDriver_1.SqlServerDriver)
                        return [2 /*return*/];
                    post = new PostWithUpdateDate_1.PostWithUpdateDate();
                    post.title = "New post";
                    return [4 /*yield*/, connection.manager.save(post)];
                case 1:
                    _a.sent();
                    return [2 /*return*/, connection
                            .getRepository(PostWithUpdateDate_1.PostWithUpdateDate)
                            .findOne(1, { lock: { mode: "optimistic", version: post.updateDate } })
                            .should.not.be.rejected];
            }
        });
    }); })); });
    it("should work if both version and update date columns applied", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var post;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    // skipped because inserted milliseconds are not always equal to what we say it to insert, unskip when needed
                    if (connection.driver instanceof SqlServerDriver_1.SqlServerDriver)
                        return [2 /*return*/];
                    post = new PostWithVersionAndUpdatedDate_1.PostWithVersionAndUpdatedDate();
                    post.title = "New post";
                    return [4 /*yield*/, connection.manager.save(post)];
                case 1:
                    _a.sent();
                    return [2 /*return*/, Promise.all([
                            connection
                                .getRepository(PostWithVersionAndUpdatedDate_1.PostWithVersionAndUpdatedDate)
                                .findOne(1, { lock: { mode: "optimistic", version: post.updateDate } })
                                .should.not.be.rejected,
                            connection
                                .getRepository(PostWithVersionAndUpdatedDate_1.PostWithVersionAndUpdatedDate)
                                .findOne(1, { lock: { mode: "optimistic", version: 1 } })
                                .should.not.be.rejected,
                        ])];
            }
        });
    }); })); });
    it("should throw error if pessimistic locking not supported by given driver", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            if (connection.driver instanceof AbstractSqliteDriver_1.AbstractSqliteDriver || connection.driver instanceof CockroachDriver_1.CockroachDriver)
                return [2 /*return*/, connection.manager.transaction(function (entityManager) {
                        return Promise.all([
                            entityManager
                                .getRepository(PostWithVersion_1.PostWithVersion)
                                .findOne(1, { lock: { mode: "pessimistic_read" } })
                                .should.be.rejectedWith(LockNotSupportedOnGivenDriverError_1.LockNotSupportedOnGivenDriverError),
                            entityManager
                                .getRepository(PostWithVersion_1.PostWithVersion)
                                .findOne(1, { lock: { mode: "pessimistic_write" } })
                                .should.be.rejectedWith(LockNotSupportedOnGivenDriverError_1.LockNotSupportedOnGivenDriverError),
                        ]);
                    })];
            return [2 /*return*/];
        });
    }); })); });
});
//# sourceMappingURL=find-options-locking.js.map