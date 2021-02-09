import "reflect-metadata";
import {CockroachDriver} from "../../../../src/driver/cockroachdb/CockroachDriver";
import {SapDriver} from "../../../../src/driver/sap/SapDriver";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../../utils/test-utils";
import {Connection} from "../../../../src/connection/Connection";
import {PostWithVersion} from "./entity/PostWithVersion";
import {Post} from './entity/Post';
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
import { VersionUtils } from "../../../../src/util/VersionUtils";

describe("query builder > locking", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should not attach pessimistic read lock statement on query if locking is not used", () => Promise.all(connections.map(async connection => {
        if (connection.driver instanceof AbstractSqliteDriver || connection.driver instanceof SapDriver)
            return;

        const sql = connection.createQueryBuilder(PostWithVersion, "post")
            .where("post.id = :id", { id: 1 })
            .getSql();

        expect(sql.indexOf("LOCK IN SHARE MODE") === -1).to.be.true;
        expect(sql.indexOf("FOR SHARE") === -1).to.be.true;
        expect(sql.indexOf("WITH (HOLDLOCK, ROWLOCK)") === -1).to.be.true;
    })));

    it("should throw error if pessimistic lock used without transaction", () => Promise.all(connections.map(async connection => {
        if (connection.driver instanceof AbstractSqliteDriver || connection.driver instanceof SapDriver)
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
        if (connection.driver instanceof AbstractSqliteDriver || connection.driver instanceof CockroachDriver || connection.driver instanceof SapDriver)
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

    it("should throw error if for no key update lock used without transaction", () => Promise.all(connections.map(async connection => {
        if (connection.driver instanceof PostgresDriver) {
            return connection.createQueryBuilder(PostWithVersion, "post")
                .setLock("for_no_key_update")
                .where("post.id = :id", { id: 1 })
                .getOne().should.be.rejectedWith(PessimisticLockTransactionRequiredError);
        }
        return;
    })));

    it("should not throw error if for no key update lock used with transaction", () => Promise.all(connections.map(async connection => {
        if (connection.driver instanceof PostgresDriver) {
            return connection.manager.transaction(entityManager => {
                return Promise.all([entityManager.createQueryBuilder(PostWithVersion, "post")
                    .setLock("for_no_key_update")
                    .where("post.id = :id", { id: 1})
                    .getOne().should.not.be.rejected]);
            });
        }
        return;
    })));

    it("should throw error if pessimistic_partial_write lock used without transaction", () => Promise.all(connections.map(async connection => {
        if (connection.driver instanceof PostgresDriver) {
            return connection.createQueryBuilder(PostWithVersion, "post")
                .setLock("pessimistic_partial_write")
                .where("post.id = :id", { id: 1 })
                .getOne().should.be.rejectedWith(PessimisticLockTransactionRequiredError);
        }

        if (connection.driver instanceof MysqlDriver) {
            let [{ version }] = await connection.query(
                "SELECT VERSION() as version;"
            );
            version = version.toLowerCase();
            if (version.includes('maria')) return; // not supported in mariadb
            if (VersionUtils.isGreaterOrEqual(version, '8.0.0')) {
                return connection.createQueryBuilder(PostWithVersion, "post")
                .setLock("pessimistic_partial_write")
                .where("post.id = :id", { id: 1 })
                .getOne().should.be.rejectedWith(PessimisticLockTransactionRequiredError);                
            }
        }
        return;
    })));    

    it("should not throw error if pessimistic_partial_write lock used with transaction", () => Promise.all(connections.map(async connection => {
        if (connection.driver instanceof PostgresDriver) {  
            return connection.manager.transaction(entityManager => {
                return Promise.all([entityManager.createQueryBuilder(PostWithVersion, "post")
                    .setLock("pessimistic_partial_write")
                    .where("post.id = :id", { id: 1})
                    .getOne().should.not.be.rejected]);
            });
        }

        if (connection.driver instanceof MysqlDriver) {
            let [{ version }] = await connection.query(
                "SELECT VERSION() as version;"
            );
            version = version.toLowerCase();
            if (version.includes('maria')) return; // not supported in mariadb
            if (VersionUtils.isGreaterOrEqual(version, '8.0.0')) {
                return connection.manager.transaction(entityManager => {
                    return Promise.all([entityManager.createQueryBuilder(PostWithVersion, "post")
                        .setLock("pessimistic_partial_write")
                        .where("post.id = :id", { id: 1})
                        .getOne().should.not.be.rejected]);
                });
            }
        }        
        return;
    })));
    
    it("should throw error if pessimistic_write_or_fail lock used without transaction", () => Promise.all(connections.map(async connection => {
        if (connection.driver instanceof PostgresDriver) {
            return connection.createQueryBuilder(PostWithVersion, "post")
                .setLock("pessimistic_write_or_fail")
                .where("post.id = :id", { id: 1 })
                .getOne().should.be.rejectedWith(PessimisticLockTransactionRequiredError);
        }

        if (connection.driver instanceof MysqlDriver) {
            let [{ version }] = await connection.query(
                "SELECT VERSION() as version;"
            );
            version = version.toLowerCase();
            if ((version.includes('maria') && VersionUtils.isGreaterOrEqual(version, "10.3.0")) || !version.includes('maria') && VersionUtils.isGreaterOrEqual(version, '8.0.0')) {
                return connection.createQueryBuilder(PostWithVersion, "post")
                .setLock("pessimistic_write_or_fail")
                .where("post.id = :id", { id: 1 })
                .getOne().should.be.rejectedWith(PessimisticLockTransactionRequiredError);
            }
        }
        return;        
    })));    

    it("should not throw error if pessimistic_write_or_fail lock used with transaction", () => Promise.all(connections.map(async connection => {
        if (connection.driver instanceof PostgresDriver) {
            return connection.manager.transaction(entityManager => {
                return Promise.all([entityManager.createQueryBuilder(PostWithVersion, "post")
                    .setLock("pessimistic_write_or_fail")
                    .where("post.id = :id", { id: 1})
                    .getOne().should.not.be.rejected]);
            });
        }

        if (connection.driver instanceof MysqlDriver) {
            let [{ version }] = await connection.query(
                "SELECT VERSION() as version;"
            );
            version = version.toLowerCase();
            if ((version.includes('maria') && VersionUtils.isGreaterOrEqual(version, "10.3.0")) || !version.includes('maria') && VersionUtils.isGreaterOrEqual(version, '8.0.0')) {
                return connection.manager.transaction(entityManager => {
                    return Promise.all([entityManager.createQueryBuilder(PostWithVersion, "post")
                        .setLock("pessimistic_write_or_fail")
                        .where("post.id = :id", { id: 1})
                        .getOne().should.not.be.rejected]);
                });
            }
        }        
        return;
    })));    

    it("should attach pessimistic read lock statement on query if locking enabled", () => Promise.all(connections.map(async connection => {
        if (connection.driver instanceof AbstractSqliteDriver || connection.driver instanceof CockroachDriver || connection.driver instanceof SapDriver)
            return;

        const sql = connection.createQueryBuilder(PostWithVersion, "post")
            .setLock("pessimistic_read")
            .where("post.id = :id", { id: 1 })
            .getSql();

        if (connection.driver instanceof MysqlDriver) {
            expect(sql.indexOf("LOCK IN SHARE MODE") !== -1).to.be.true;

        } else if (connection.driver instanceof PostgresDriver) {
            expect(sql.indexOf("FOR SHARE") !== -1).to.be.true;

        } else if (connection.driver instanceof OracleDriver) {
            expect(sql.indexOf("FOR UPDATE") !== -1).to.be.true;

        } else if (connection.driver instanceof SqlServerDriver) {
            expect(sql.indexOf("WITH (HOLDLOCK, ROWLOCK)") !== -1).to.be.true;
        }
    })));

    it("should attach dirty read lock statement on query if locking enabled", () => Promise.all(connections.map(async connection => {
        if (!(connection.driver instanceof SqlServerDriver)) return;

        const sql = connection.createQueryBuilder(PostWithVersion, "post")
            .setLock("dirty_read")
            .where("post.id = :id", { id: 1 })
            .getSql();

        expect(sql.indexOf("WITH (NOLOCK)") !== -1).to.be.true;
    })));

    it("should not attach pessimistic write lock statement on query if locking is not used", () => Promise.all(connections.map(async connection => {
        if (connection.driver instanceof AbstractSqliteDriver || connection.driver instanceof SapDriver)
            return;

        const sql = connection.createQueryBuilder(PostWithVersion, "post")
            .where("post.id = :id", { id: 1 })
            .getSql();

            expect(sql.indexOf("FOR UPDATE") === -1).to.be.true;
            expect(sql.indexOf("WITH (UPDLOCK, ROWLOCK)") === -1).to.be.true;
    })));

    it("should attach pessimistic write lock statement on query if locking enabled", () => Promise.all(connections.map(async connection => {
        if (connection.driver instanceof AbstractSqliteDriver || connection.driver instanceof CockroachDriver || connection.driver instanceof SapDriver)
            return;

        const sql = connection.createQueryBuilder(PostWithVersion, "post")
            .setLock("pessimistic_write")
            .where("post.id = :id", { id: 1 })
            .getSql();

        if (connection.driver instanceof MysqlDriver || connection.driver instanceof PostgresDriver || connection.driver instanceof OracleDriver) {
            expect(sql.indexOf("FOR UPDATE") !== -1).to.be.true;

        } else if (connection.driver instanceof SqlServerDriver) {
            expect(sql.indexOf("WITH (UPDLOCK, ROWLOCK)") !== -1).to.be.true;
        }

    })));

    it("should not attach for no key update lock statement on query if locking is not used", () => Promise.all(connections.map(async connection => {
        if (connection.driver instanceof PostgresDriver) {
            const sql = connection.createQueryBuilder(PostWithVersion, "post")
                .where("post.id = :id", { id: 1 })
                .getSql();

                expect(sql.indexOf("FOR NO KEY UPDATE") === -1).to.be.true;
            }
        return;
    })));

    it("should attach for no key update lock statement on query if locking enabled", () => Promise.all(connections.map(async connection => {
        if (connection.driver instanceof PostgresDriver) {
            const sql = connection.createQueryBuilder(PostWithVersion, "post")
                .setLock("for_no_key_update")
                .where("post.id = :id", { id: 1 })
                .getSql();

            expect(sql.indexOf("FOR NO KEY UPDATE") !== -1).to.be.true;
        }
        return;

    })));

    it("should not attach pessimistic_partial_write lock statement on query if locking is not used", () => Promise.all(connections.map(async connection => {
        if (connection.driver instanceof PostgresDriver || connection.driver instanceof MysqlDriver) {
            const sql = connection.createQueryBuilder(PostWithVersion, "post")
                .where("post.id = :id", { id: 1 })
                .getSql();

                expect(sql.indexOf("FOR UPDATE SKIP LOCKED") === -1).to.be.true;
            }
        return;
    })));    

    it("should attach pessimistic_partial_write lock statement on query if locking enabled", () => Promise.all(connections.map(async connection => {
        if (connection.driver instanceof PostgresDriver || connection.driver instanceof MysqlDriver) {
            const sql = connection.createQueryBuilder(PostWithVersion, "post")
                .setLock("pessimistic_partial_write")
                .where("post.id = :id", { id: 1 })
                .getSql();

            expect(sql.indexOf("FOR UPDATE SKIP LOCKED") !== -1).to.be.true;
        }
        return;

    })));    

    it("should not attach pessimistic_write_or_fail lock statement on query if locking is not used", () => Promise.all(connections.map(async connection => {
        if (connection.driver instanceof PostgresDriver || connection.driver instanceof MysqlDriver) {
            const sql = connection.createQueryBuilder(PostWithVersion, "post")
                .where("post.id = :id", { id: 1 })
                .getSql();

                expect(sql.indexOf("FOR UPDATE NOWAIT") === -1).to.be.true;
            }
        return;
    })));    

    it("should attach pessimistic_write_or_fail lock statement on query if locking enabled", () => Promise.all(connections.map(async connection => {
        if (connection.driver instanceof PostgresDriver || connection.driver instanceof MysqlDriver) {
            const sql = connection.createQueryBuilder(PostWithVersion, "post")
                .setLock("pessimistic_write_or_fail")
                .where("post.id = :id", { id: 1 })
                .getSql();

            expect(sql.indexOf("FOR UPDATE NOWAIT") !== -1).to.be.true;
        }
        return;

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
        if (connection.driver instanceof AbstractSqliteDriver || connection.driver instanceof CockroachDriver || connection.driver instanceof SapDriver)
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

    it("should throw error if for no key update locking not supported by given driver", () => Promise.all(connections.map(async connection => {
        if (!(connection.driver instanceof PostgresDriver)) {
            return connection.manager.transaction(entityManager => {
                return Promise.all([
                    entityManager.createQueryBuilder(PostWithVersion, "post")
                        .setLock("for_no_key_update")
                        .where("post.id = :id", { id: 1 })
                        .getOne().should.be.rejectedWith(LockNotSupportedOnGivenDriverError),
                ]);
            });
        }

        return;
    })));

    it("should only specify locked tables in FOR UPDATE OF clause if argument is given", () => Promise.all(connections.map(async connection => {
        if (!(connection.driver instanceof PostgresDriver))
            return;

        const sql = connection.createQueryBuilder(Post, "post")
            .innerJoin("post.author", "user")
            .setLock('pessimistic_write', undefined, ["user"])
            .getSql();

        expect(sql).to.match(/FOR UPDATE OF user$/);

        const sql2 = connection.createQueryBuilder(Post, "post")
            .innerJoin("post.author", "user")
            .setLock('pessimistic_write', undefined, ["post","user"])
            .getSql();

        expect(sql2).to.match(/FOR UPDATE OF post, user$/);
    })));

    it("should not allow empty array for lockTables", () => Promise.all(connections.map(async connection => {
        if (!(connection.driver instanceof PostgresDriver))
            return;

        return connection.manager.transaction(entityManager => {
            return Promise.all([
                entityManager.createQueryBuilder(Post, "post")
                    .innerJoin("post.author", "user")
                    .setLock('pessimistic_write', undefined, [])
                    .getOne().should.be.rejectedWith('lockTables cannot be an empty array'),
            ]);
        });
    })));

    it("should throw error when specifying a table that is not part of the query", () => Promise.all(connections.map(async connection => {
        if (!(connection.driver instanceof PostgresDriver))
            return;

        return connection.manager.transaction(entityManager => {
            return Promise.all([
                entityManager.createQueryBuilder(Post, "post")
                    .innerJoin("post.author", "user")
                    .setLock('pessimistic_write', undefined, ["img"])
                    .getOne().should.be.rejectedWith('relation "img" in FOR UPDATE clause not found in FROM clause'),
            ]);
        });
    })));

    it("should allow on a left join", () => Promise.all(connections.map(async connection => {
        if (!(connection.driver instanceof PostgresDriver))
            return;

        return connection.manager.transaction(entityManager => {

            return Promise.all([
                entityManager.createQueryBuilder(Post, "post")
                    .leftJoin("post.author", "user")
                    .setLock('pessimistic_write', undefined, ["post"])
                    .getOne(),
                entityManager.createQueryBuilder(Post, "post")
                    .leftJoin("post.author", "user")
                    .setLock('pessimistic_write')
                    .getOne().should.be.rejectedWith('FOR UPDATE cannot be applied to the nullable side of an outer join'),
            ]);
        });
    })));

    it("should allow using lockTables on all types of locking", () => Promise.all(connections.map(async connection => {
        if (!(connection.driver instanceof PostgresDriver))
            return;

        return connection.manager.transaction(entityManager => {

            return Promise.all([
                entityManager.createQueryBuilder(Post, "post")
                    .leftJoin("post.author", "user")
                    .setLock('pessimistic_read', undefined, ["post"])
                    .getOne(),
                entityManager.createQueryBuilder(Post, "post")
                    .leftJoin("post.author", "user")
                    .setLock('pessimistic_write', undefined, ["post"])
                    .getOne(),
                entityManager.createQueryBuilder(Post, "post")
                    .leftJoin("post.author", "user")
                    .setLock('pessimistic_partial_write', undefined, ["post"])
                    .getOne(),
                entityManager.createQueryBuilder(Post, "post")
                    .leftJoin("post.author", "user")
                    .setLock('pessimistic_write_or_fail', undefined, ["post"])
                    .getOne(),
                entityManager.createQueryBuilder(Post, "post")
                    .leftJoin("post.author", "user")
                    .setLock('for_no_key_update', undefined, ["post"])
                    .getOne(),
            ]);
        });
    })));

    it("should allow locking a relation of a relation", () => Promise.all(connections.map(async connection => {
        if (!(connection.driver instanceof PostgresDriver))
            return;

        return connection.manager.transaction(entityManager => {

            return Promise.all([
                entityManager.createQueryBuilder(Post, "post")
                    .innerJoin("post.categories", "cat")
                    .innerJoin("cat.images", "img")
                    .setLock('pessimistic_write', undefined, ["img"])
                    .getOne()
            ]);
        });
    })));
});
