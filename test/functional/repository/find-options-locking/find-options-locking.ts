import "reflect-metadata";
import {CockroachDriver} from "../../../../src/driver/cockroachdb/CockroachDriver";
import {SapDriver} from "../../../../src/driver/sap/SapDriver";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../../utils/test-utils";
import {Connection} from "../../../../src";
import {PostWithVersion} from "./entity/PostWithVersion";
import {expect} from "chai";
import {PostWithoutVersionAndUpdateDate} from "./entity/PostWithoutVersionAndUpdateDate";
import {PostWithUpdateDate} from "./entity/PostWithUpdateDate";
import {PostWithVersionAndUpdatedDate} from "./entity/PostWithVersionAndUpdatedDate";
import {Post} from './entity/Post';
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

describe("repository > find options > locking", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should throw error if pessimistic lock used without transaction", () => Promise.all(connections.map(async connection => {
        if (connection.driver instanceof AbstractSqliteDriver || connection.driver instanceof CockroachDriver || connection.driver instanceof SapDriver)
            return;

        return Promise.all([
            connection
                .getRepository(PostWithVersion)
                .findOne(1, { lock: { mode: "pessimistic_read" } })
                .should.be.rejectedWith(PessimisticLockTransactionRequiredError),

            connection
                .getRepository(PostWithVersion)
                .findOne(1, { lock: { mode: "pessimistic_write" } })
                .should.be.rejectedWith(PessimisticLockTransactionRequiredError),
        ]);
    })));

    it("should not throw error if pessimistic lock used with transaction", () => Promise.all(connections.map(async connection => {
        if (connection.driver instanceof AbstractSqliteDriver || connection.driver instanceof CockroachDriver || connection.driver instanceof SapDriver)
            return;

        return connection.manager.transaction(entityManager => {
            return Promise.all([
                entityManager
                    .getRepository(PostWithVersion)
                    .findOne(1, { lock: { mode: "pessimistic_read" } })
                    .should.not.be.rejected,

                entityManager
                    .getRepository(PostWithVersion)
                    .findOne(1, { lock: { mode: "pessimistic_write" } })
                    .should.not.be.rejected
            ]);
        });
    })));

    it("should attach pessimistic read lock statement on query if locking enabled", () => Promise.all(connections.map(async connection => {
        if (connection.driver instanceof AbstractSqliteDriver || connection.driver instanceof CockroachDriver || connection.driver instanceof SapDriver)
            return;

        const executedSql: string[] = [];

        await connection.manager.transaction(entityManager => {
            const originalQuery = entityManager.queryRunner!.query.bind(entityManager.queryRunner);
            entityManager.queryRunner!.query = (...args) => {
                executedSql.push(args[0]);
                return originalQuery(...args);
            };

            return entityManager
                .getRepository(PostWithVersion)
                .findOne(1, {lock: {mode: "pessimistic_read"}});
        });

        if (connection.driver instanceof MysqlDriver) {
            expect(executedSql[0].indexOf("LOCK IN SHARE MODE") !== -1).to.be.true;

        } else if (connection.driver instanceof PostgresDriver) {
            expect(executedSql[0].indexOf("FOR SHARE") !== -1).to.be.true;

        } else if (connection.driver instanceof OracleDriver) {
            expect(executedSql[0].indexOf("FOR UPDATE") !== -1).to.be.true;

        } else if (connection.driver instanceof SqlServerDriver) {
            expect(executedSql[0].indexOf("WITH (HOLDLOCK, ROWLOCK)") !== -1).to.be.true;
        }

    })));

    it("should attach pessimistic write lock statement on query if locking enabled", () => Promise.all(connections.map(async connection => {
        if (connection.driver instanceof AbstractSqliteDriver || connection.driver instanceof CockroachDriver || connection.driver instanceof SapDriver)
            return;

        const executedSql: string[] = [];

        await connection.manager.transaction(entityManager => {
            const originalQuery = entityManager.queryRunner!.query.bind(entityManager.queryRunner);
            entityManager.queryRunner!.query = (...args) => {
                executedSql.push(args[0]);
                return originalQuery(...args);
            };

            return entityManager
                .getRepository(PostWithVersion)
                .findOne(1, {lock: {mode: "pessimistic_write"}});
        });

        if (connection.driver instanceof MysqlDriver || connection.driver instanceof PostgresDriver || connection.driver instanceof OracleDriver) {
            expect(executedSql[0].indexOf("FOR UPDATE") !== -1).to.be.true;

        } else if (connection.driver instanceof SqlServerDriver) {
            expect(executedSql[0].indexOf("WITH (UPDLOCK, ROWLOCK)") !== -1).to.be.true;
        }

    })));

    it("should attach dirty read lock statement on query if locking enabled", () => Promise.all(connections.map(async connection => {
        if (!(connection.driver instanceof SqlServerDriver)) return;

        const executedSql: string[] = [];

        await connection.manager.transaction(entityManager => {
            const originalQuery = entityManager.queryRunner!.query.bind(entityManager.queryRunner);
            entityManager.queryRunner!.query = (...args) => {
                executedSql.push(args[0]);
                return originalQuery(...args);
            };

            return entityManager
                .getRepository(PostWithVersion)
                .findOne(1, {lock: {mode: "dirty_read"}});
        });

        expect(executedSql[0].indexOf("WITH (NOLOCK)") !== -1).to.be.true;

    })));

    it("should throw error if optimistic lock used with `find` method", () => Promise.all(connections.map(async connection => {
       return connection
           .getRepository(PostWithVersion)
           .find({lock: {mode: "optimistic", version: 1}})
           .should.be.rejectedWith(OptimisticLockCanNotBeUsedError);
    })));

    it("should not throw error if optimistic lock used with `findOne` method", () => Promise.all(connections.map(async connection => {
        return connection
            .getRepository(PostWithVersion)
            .findOne(1, {lock: {mode: "optimistic", version: 1}})
            .should.not.be.rejected;
    })));

    it("should throw error if entity does not have version and update date columns", () => Promise.all(connections.map(async connection => {

        const post = new PostWithoutVersionAndUpdateDate();
        post.title = "New post";
        await connection.manager.save(post);

        return connection
            .getRepository(PostWithoutVersionAndUpdateDate)
            .findOne(1, {lock: {mode: "optimistic", version: 1}})
            .should.be.rejectedWith(NoVersionOrUpdateDateColumnError);
    })));

    it("should throw error if actual version does not equal expected version", () => Promise.all(connections.map(async connection => {

        const post = new PostWithVersion();
        post.title = "New post";
        await connection.manager.save(post);

        return connection
            .getRepository(PostWithVersion)
            .findOne(1, {lock: {mode: "optimistic", version: 2}})
            .should.be.rejectedWith(OptimisticLockVersionMismatchError);
    })));

    it("should not throw error if actual version and expected versions are equal", () => Promise.all(connections.map(async connection => {

        const post = new PostWithVersion();
        post.title = "New post";
        await connection.manager.save(post);

        return connection
            .getRepository(PostWithVersion)
            .findOne(1, {lock: {mode: "optimistic", version: 1}})
            .should.not.be.rejected;
    })));

    it("should throw error if actual updated date does not equal expected updated date", () => Promise.all(connections.map(async connection => {

        // skipped because inserted milliseconds are not always equal to what we say it to insert, unskip when needed
        if (connection.driver instanceof SqlServerDriver)
            return;

        const post = new PostWithUpdateDate();
        post.title = "New post";
        await connection.manager.save(post);

        return connection
            .getRepository(PostWithUpdateDate)
            .findOne(1, {lock: {mode: "optimistic", version: new Date(2017, 1, 1)}})
            .should.be.rejectedWith(OptimisticLockVersionMismatchError);
    })));

    it("should not throw error if actual updated date and expected updated date are equal", () => Promise.all(connections.map(async connection => {

        // skipped because inserted milliseconds are not always equal to what we say it to insert, unskip when needed
        if (connection.driver instanceof SqlServerDriver)
            return;

        const post = new PostWithUpdateDate();
        post.title = "New post";
        await connection.manager.save(post);

        return connection
            .getRepository(PostWithUpdateDate)
            .findOne(1, {lock: {mode: "optimistic", version: post.updateDate}})
            .should.not.be.rejected;
    })));

    it("should work if both version and update date columns applied", () => Promise.all(connections.map(async connection => {

        // skipped because inserted milliseconds are not always equal to what we say it to insert, unskip when needed
        if (connection.driver instanceof SqlServerDriver)
            return;

        const post = new PostWithVersionAndUpdatedDate();
        post.title = "New post";
        await connection.manager.save(post);

        return Promise.all([
            connection
                .getRepository(PostWithVersionAndUpdatedDate)
                .findOne(1, {lock: {mode: "optimistic", version: post.updateDate}})
                .should.not.be.rejected,
            connection
                .getRepository(PostWithVersionAndUpdatedDate)
                .findOne(1, {lock: {mode: "optimistic", version: 1}})
                .should.not.be.rejected,
        ]);
    })));

    it("should throw error if pessimistic locking not supported by given driver", () => Promise.all(connections.map(async connection => {
        if (connection.driver instanceof AbstractSqliteDriver || connection.driver instanceof CockroachDriver || connection.driver instanceof SapDriver)
            return connection.manager.transaction(entityManager => {
                return Promise.all([
                    entityManager
                        .getRepository(PostWithVersion)
                        .findOne(1, { lock: { mode: "pessimistic_read" } })
                        .should.be.rejectedWith(LockNotSupportedOnGivenDriverError),

                    entityManager
                        .getRepository(PostWithVersion)
                        .findOne(1, { lock: { mode: "pessimistic_write" } })
                        .should.be.rejectedWith(LockNotSupportedOnGivenDriverError),
                ]);
            });

        return;
    })));

    it("should not allow empty array for lockTables", () => Promise.all(connections.map(async connection => {
        if (!(connection.driver instanceof PostgresDriver))
            return;

        return connection.manager.transaction(entityManager => {
            return Promise.all([
                entityManager.getRepository(Post)
                    .findOne({
                        lock: {mode: 'pessimistic_write', tables: []}
                    }).should.be.rejectedWith('lockTables cannot be an empty array'),
            ]);
        });
    })));

    it("should throw error when specifying a table that is not part of the query", () => Promise.all(connections.map(async connection => {
        if (!(connection.driver instanceof PostgresDriver))
            return;

        return connection.manager.transaction(entityManager => {
            return Promise.all([
                entityManager.getRepository(Post)
                    .findOne({
                        relations: ['author'],
                        lock: {mode: 'pessimistic_write', tables: ['img']}
                    }).should.be.rejectedWith('"img" is not part of this query')
            ]);
        });
    })));

    it("should allow on a left join", () => Promise.all(connections.map(async connection => {
        if (!(connection.driver instanceof PostgresDriver))
            return;

        return connection.manager.transaction(entityManager => {
            return Promise.all([
                entityManager.getRepository(Post).findOne({
                    relations: ['author'],
                    lock: {mode: 'pessimistic_write', tables: ['post']}
                }),
                entityManager.getRepository(Post).findOne({
                    relations: ['author'],
                    lock: {mode: 'pessimistic_write'}
                }).should.be.rejectedWith('FOR UPDATE cannot be applied to the nullable side of an outer join')
            ]);
        });
    })));

    it("should allow using lockTables on all types of locking", () => Promise.all(connections.map(async connection => {
        if (!(connection.driver instanceof PostgresDriver))
            return;

        return connection.manager.transaction(entityManager => {

            return Promise.all([
                entityManager.getRepository(Post).findOne({
                    relations: ['author'],
                    lock: {mode: 'pessimistic_read', tables: ['post']}
                }),
                entityManager.getRepository(Post).findOne({
                    relations: ['author'],
                    lock: {mode: 'pessimistic_write', tables: ['post']}
                }),
                entityManager.getRepository(Post).findOne({
                    relations: ['author'],
                    lock: {mode: 'pessimistic_partial_write', tables: ['post']}
                }),
                entityManager.getRepository(Post).findOne({
                    relations: ['author'],
                    lock: {mode: 'pessimistic_write_or_fail', tables: ['post']}
                }),
                entityManager.getRepository(Post).findOne({
                    relations: ['author'],
                    lock: {mode: 'for_no_key_update', tables: ['post']}
                }),
            ]);
        });
    })));

    it("should allow locking a relation of a relation", () => Promise.all(connections.map(async connection => {
        if (!(connection.driver instanceof PostgresDriver))
            return;

        return connection.manager.transaction(entityManager => {

            return Promise.all([
                entityManager.getRepository(Post).findOne({
                    join: {
                        alias: 'post',
                        innerJoinAndSelect: {
                            categorys: 'post.categories',
                            images: 'categorys.images'
                        }
                    },
                    lock: {mode: 'pessimistic_write', tables: ['image']}
                }),
            ]);
        });
    })));

});
