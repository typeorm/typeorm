import "reflect-metadata";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../../utils/test-utils";
import {Connection} from "../../../../src/connection/Connection";
import {PostWithVersion} from "./entity/PostWithVersion";
import {expect} from "chai";
import {PostWithoutVersionAndUpdateDate} from "./entity/PostWithoutVersionAndUpdateDate";
import {PostWithUpdateDate} from "./entity/PostWithUpdateDate";
import {PostWithVersionAndUpdatedDate} from "./entity/PostWithVersionAndUpdatedDate";
import {OptimisticLockVersionMismatchError} from "../../../../src/error/OptimisticLockVersionMismatchError";
import {OptimisticLockCanNotBeUsedError} from "../../../../src/error/OptimisticLockCanNotBeUsedError";
import {NoVersionOrUpdateDateColumnError} from "../../../../src/error/NoVersionOrUpdateDateColumnError";
import {PessimisticLockTransactionRequiredError} from "../../../../src/error/PessimisticLockTransactionRequiredError";
import {MysqlDriver} from "../../../../src/driver/mysql/MysqlDriver";
import {PostgresDriver} from "../../../../src/driver/postgres/PostgresDriver";
import {SqlServerDriver} from "../../../../src/driver/sqlserver/SqlServerDriver";
import {AbstractSqliteDriver} from "../../../../src/driver/sqlite-abstract/AbstractSqliteDriver";
import {OracleDriver} from "../../../../src/driver/oracle/OracleDriver";
import {LockNotSupportedOnGivenDriverError} from "../../../../src/error/LockNotSupportedOnGivenDriverError";

describe("query builder > locking", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should not attach pessimistic read lock statement on query if locking is not used", () => Promise.all(connections.map(async connection => {
        if (connection.driver instanceof AbstractSqliteDriver || connection.driver instanceof OracleDriver)
            return;

        const sql = connection.createQueryBuilder(PostWithVersion, "post")
            .where("post.id = :id", { id: 1 })
            .getSql();

        if (connection.driver instanceof MysqlDriver) {
            expect(sql.indexOf("LOCK IN SHARE MODE") === -1).to.be.true;

        } else if (connection.driver instanceof PostgresDriver) {
            expect(sql.indexOf("FOR SHARE") === -1).to.be.true;

        } else if (connection.driver instanceof SqlServerDriver) {
            expect(sql.indexOf("WITH (HOLDLOCK, ROWLOCK)") === -1).to.be.true;
        }
    })));

    it("should throw error if pessimistic lock used without transaction", () => Promise.all(connections.map(async connection => {
        if (connection.driver instanceof AbstractSqliteDriver || connection.driver instanceof OracleDriver)
            return;

        return Promise.all([
            connection.createQueryBuilder(PostWithVersion, "post")
                .setLock("pessimistic_read")
                .where("post.id = :id", { id: 1 })
                .getOne().should.be.rejectedWith(PessimisticLockTransactionRequiredError),

            connection.createQueryBuilder(PostWithVersion, "post")
                .setLock("pessimistic_write")
                .where("post.id = :id", { id: 1 })
                .getOne().should.be.rejectedWith(PessimisticLockTransactionRequiredError)
        ]);
    })));

    it("should not throw error if pessimistic lock used with transaction", () => Promise.all(connections.map(async connection => {
        if (connection.driver instanceof AbstractSqliteDriver || connection.driver instanceof OracleDriver)
            return;

        return connection.manager.transaction(entityManager => {
            return Promise.all([
                entityManager.createQueryBuilder(PostWithVersion, "post")
                    .setLock("pessimistic_read")
                    .where("post.id = :id", { id: 1 })
                    .getOne().should.not.be.rejected,

                entityManager.createQueryBuilder(PostWithVersion, "post")
                    .setLock("pessimistic_write")
                    .where("post.id = :id", { id: 1 })
                    .getOne().should.not.be.rejected
            ]);
        });
    })));

    it("should attach pessimistic read lock statement on query if locking enabled", () => Promise.all(connections.map(async connection => {
        if (connection.driver instanceof AbstractSqliteDriver || connection.driver instanceof OracleDriver)
            return;

        const sql = connection.createQueryBuilder(PostWithVersion, "post")
            .setLock("pessimistic_read")
            .where("post.id = :id", { id: 1 })
            .getSql();

        if (connection.driver instanceof MysqlDriver) {
            expect(sql.indexOf("LOCK IN SHARE MODE") !== -1).to.be.true;

        } else if (connection.driver instanceof PostgresDriver) {
            expect(sql.indexOf("FOR SHARE") !== -1).to.be.true;

        } else if (connection.driver instanceof SqlServerDriver) {
            expect(sql.indexOf("WITH (HOLDLOCK, ROWLOCK)") !== -1).to.be.true;
        }
    })));

    it("should not attach pessimistic write lock statement on query if locking is not used", () => Promise.all(connections.map(async connection => {
        if (connection.driver instanceof AbstractSqliteDriver || connection.driver instanceof OracleDriver)
            return;

        const sql = connection.createQueryBuilder(PostWithVersion, "post")
            .where("post.id = :id", { id: 1 })
            .getSql();

        if (connection.driver instanceof MysqlDriver || connection.driver instanceof PostgresDriver) {
            expect(sql.indexOf("FOR UPDATE") === -1).to.be.true;

        } else if (connection.driver instanceof SqlServerDriver) {
            expect(sql.indexOf("WITH (UPDLOCK, ROWLOCK)") === -1).to.be.true;
        }
    })));

    it("should attach pessimistic write lock statement on query if locking enabled", () => Promise.all(connections.map(async connection => {
        if (connection.driver instanceof AbstractSqliteDriver || connection.driver instanceof OracleDriver)
            return;

        const sql = connection.createQueryBuilder(PostWithVersion, "post")
            .setLock("pessimistic_write")
            .where("post.id = :id", { id: 1 })
            .getSql();

        if (connection.driver instanceof MysqlDriver || connection.driver instanceof PostgresDriver) {
            expect(sql.indexOf("FOR UPDATE") !== -1).to.be.true;

        } else if (connection.driver instanceof SqlServerDriver) {
            expect(sql.indexOf("WITH (UPDLOCK, ROWLOCK)") !== -1).to.be.true;
        }

    })));

    it("should throw error if optimistic lock used with getMany method", () => Promise.all(connections.map(async connection => {

       return connection.createQueryBuilder(PostWithVersion, "post")
           .setLock("optimistic", 1)
           .getMany().should.be.rejectedWith(OptimisticLockCanNotBeUsedError);
    })));

    it("should throw error if optimistic lock used with getCount method", () => Promise.all(connections.map(async connection => {

        return connection.createQueryBuilder(PostWithVersion, "post")
           .setLock("optimistic", 1)
           .getCount().should.be.rejectedWith(OptimisticLockCanNotBeUsedError);
    })));

    it("should throw error if optimistic lock used with getManyAndCount method", () => Promise.all(connections.map(async connection => {

       return connection.createQueryBuilder(PostWithVersion, "post")
           .setLock("optimistic", 1)
           .getManyAndCount().should.be.rejectedWith(OptimisticLockCanNotBeUsedError);
    })));

    it("should throw error if optimistic lock used with getRawMany method", () => Promise.all(connections.map(async connection => {

       return connection.createQueryBuilder(PostWithVersion, "post")
           .setLock("optimistic", 1)
           .getRawMany().should.be.rejectedWith(OptimisticLockCanNotBeUsedError);
    })));

    it("should throw error if optimistic lock used with getRawOne method", () => Promise.all(connections.map(async connection => {

       return connection.createQueryBuilder(PostWithVersion, "post")
           .setLock("optimistic", 1)
           .where("post.id = :id", { id: 1 })
           .getRawOne().should.be.rejectedWith(OptimisticLockCanNotBeUsedError);
    })));

    it("should not throw error if optimistic lock used with getOne method", () => Promise.all(connections.map(async connection => {

       return connection.createQueryBuilder(PostWithVersion, "post")
           .setLock("optimistic", 1)
           .where("post.id = :id", { id: 1 })
           .getOne().should.not.be.rejected;
    })));

    it.skip("should throw error if entity does not have version and update date columns", () => Promise.all(connections.map(async connection => {

        const post = new PostWithoutVersionAndUpdateDate();
        post.title = "New post";
        await connection.manager.save(post);

        return connection.createQueryBuilder(PostWithoutVersionAndUpdateDate, "post")
           .setLock("optimistic", 1)
           .where("post.id = :id", { id: 1 })
           .getOne().should.be.rejectedWith(NoVersionOrUpdateDateColumnError);
    })));

    // skipped because inserted milliseconds are not always equal to what we say it to insert, unskip when needed
    it.skip("should throw error if actual version does not equal expected version", () => Promise.all(connections.map(async connection => {

        const post = new PostWithVersion();
        post.title = "New post";
        await connection.manager.save(post);

       return connection.createQueryBuilder(PostWithVersion, "post")
           .setLock("optimistic", 2)
           .where("post.id = :id", { id: 1 })
           .getOne().should.be.rejectedWith(OptimisticLockVersionMismatchError);
    })));

    // skipped because inserted milliseconds are not always equal to what we say it to insert, unskip when needed
    it.skip("should not throw error if actual version and expected versions are equal", () => Promise.all(connections.map(async connection => {

        const post = new PostWithVersion();
        post.title = "New post";
        await connection.manager.save(post);

       return connection.createQueryBuilder(PostWithVersion, "post")
           .setLock("optimistic", 1)
           .where("post.id = :id", { id: 1 })
           .getOne().should.not.be.rejected;
    })));

    // skipped because inserted milliseconds are not always equal to what we say it to insert, unskip when needed
    it.skip("should throw error if actual updated date does not equal expected updated date", () => Promise.all(connections.map(async connection => {

        const post = new PostWithUpdateDate();
        post.title = "New post";
        await connection.manager.save(post);

       return connection.createQueryBuilder(PostWithUpdateDate, "post")
           .setLock("optimistic", new Date(2017, 1, 1))
           .where("post.id = :id", { id: 1 })
           .getOne().should.be.rejectedWith(OptimisticLockVersionMismatchError);
    })));

    // skipped because inserted milliseconds are not always equal to what we say it to insert, unskip when needed
    it.skip("should not throw error if actual updated date and expected updated date are equal", () => Promise.all(connections.map(async connection => {

        if (connection.driver instanceof SqlServerDriver)
            return;

        const post = new PostWithUpdateDate();
        post.title = "New post";
        await connection.manager.save(post);

        return connection.createQueryBuilder(PostWithUpdateDate, "post")
            .setLock("optimistic", post.updateDate)
            .where("post.id = :id", {id: 1})
            .getOne().should.not.be.rejected;
    })));

    // skipped because inserted milliseconds are not always equal to what we say it to insert, unskip when needed
    it.skip("should work if both version and update date columns applied", () => Promise.all(connections.map(async connection => {

        const post = new PostWithVersionAndUpdatedDate();
        post.title = "New post";
        await connection.manager.save(post);

        return Promise.all([
            connection.createQueryBuilder(PostWithVersionAndUpdatedDate, "post")
                .setLock("optimistic", post.updateDate)
                .where("post.id = :id", { id: 1 })
                .getOne().should.not.be.rejected,

            connection.createQueryBuilder(PostWithVersionAndUpdatedDate, "post")
                .setLock("optimistic", 1)
                .where("post.id = :id", { id: 1 })
                .getOne().should.not.be.rejected
        ]);
    })));

    it("should throw error if pessimistic locking not supported by given driver", () => Promise.all(connections.map(async connection => {
        if (connection.driver instanceof AbstractSqliteDriver || connection.driver instanceof OracleDriver)
            return connection.manager.transaction(entityManager => {
                return Promise.all([
                    entityManager.createQueryBuilder(PostWithVersion, "post")
                        .setLock("pessimistic_read")
                        .where("post.id = :id", { id: 1 })
                        .getOne().should.be.rejectedWith(LockNotSupportedOnGivenDriverError),

                    entityManager.createQueryBuilder(PostWithVersion, "post")
                        .setLock("pessimistic_write")
                        .where("post.id = :id", { id: 1 })
                        .getOne().should.be.rejectedWith(LockNotSupportedOnGivenDriverError)
                ]);
            });

        return;
    })));

});
