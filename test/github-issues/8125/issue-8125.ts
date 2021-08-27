import "reflect-metadata";
import {createTestingConnections, closeTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src/connection/Connection";
import {expect} from "chai";
import {DailyStats} from "./entity/DailyStats";
import {MysqlDriver} from "../../../src/driver/mysql/MysqlDriver";
import {PostgresDriver} from "../../../src/driver/postgres/PostgresDriver";
import {AbstractSqliteDriver} from "../../../src/driver/sqlite-abstract/AbstractSqliteDriver";

describe("github issues > #8125 - Mysql, Postgres & SQLite - on duplicate key update using custom expression", () => {
    let connections: Connection[];

    before(async () => connections = await createTestingConnections({
        entities: [DailyStats],
        schemaCreate: true,
        dropSchema: true,
    }));

    beforeEach(() => reloadTestingDatabases(connections));

    after(() => closeTestingConnections(connections));

    it("should overwrite using custom expression in MySQL/MariaDB", () => Promise.all(connections.map(async connection => {
        try {
            if (connection.driver instanceof MysqlDriver) {
                const DailyStatsRepository = connection.manager.getRepository(DailyStats);

                await DailyStatsRepository
                    .createQueryBuilder()
                    .insert()
                    .into(DailyStats)
                    .values({feedItemId: 1, date: '2021-01-01', views: 1})
                    .execute();

                await DailyStatsRepository
                    .createQueryBuilder()
                    .insert()
                    .into(DailyStats)
                    .values({feedItemId: 1, date: '2021-01-01', views: 2})
                    .orUpdate([{column: 'views', expression: 'views + VALUES(views)'}], ['feedItemId', 'date'])
                    .execute();

                expect(await DailyStatsRepository.count()).to.be.eql(1);
                expect(await DailyStatsRepository.findOneOrFail()).to.be.eql({
                    feedItemId: 1,
                    date: '2021-01-01',
                    views: 3 // Overwritten by existing value + new value (using custom expression)
                });
            }
        } catch (err) {
            throw new Error(err);
        }
    })));

    it("should default to existing behaviour when no expression given in MySQL/MariaDB", () => Promise.all(connections.map(async connection => {
        try {
            if (connection.driver instanceof MysqlDriver) {
                const DailyStatsRepository = connection.manager.getRepository(DailyStats);

                await DailyStatsRepository
                    .createQueryBuilder()
                    .insert()
                    .into(DailyStats)
                    .values({feedItemId: 1, date: '2021-01-01', views: 1})
                    .execute();

                await DailyStatsRepository
                    .createQueryBuilder()
                    .insert()
                    .into(DailyStats)
                    .values({feedItemId: 1, date: '2021-01-01', views: 2})
                    .orUpdate([{column: 'views'}], ['feedItemId', 'date'])
                    .execute();

                expect(await DailyStatsRepository.count()).to.be.eql(1);
                expect(await DailyStatsRepository.findOneOrFail()).to.be.eql({
                    feedItemId: 1,
                    date: '2021-01-01',
                    views: 2 // Overwritten by value (no custom expression)
                });
            }
        } catch (err) {
            throw new Error(err);
        }
    })));

    it("should overwrite using current value in PostgreSQL and SQLite", () => Promise.all(connections.map(async connection => {
        try {
            if (connection.driver instanceof PostgresDriver || connection.driver instanceof AbstractSqliteDriver) {
                const DailyStatsRepository = connection.manager.getRepository(DailyStats);

                await DailyStatsRepository
                    .createQueryBuilder()
                    .insert()
                    .into(DailyStats)
                    .values({feedItemId: 1, date: '2021-01-01', views: 1})
                    .execute();

                await DailyStatsRepository
                    .createQueryBuilder()
                    .insert()
                    .into(DailyStats)
                    .values({feedItemId: 1, date: '2021-01-01', views: 2})
                    .orUpdate([{column: 'views', expression: 'views + EXCLUDED.views'}], ['feedItemId', 'date'])
                    .execute();

                expect(await DailyStatsRepository.count()).to.be.eql(1);
                expect(await DailyStatsRepository.findOneOrFail()).to.be.eql({
                    feedItemId: 1,
                    date: '2021-01-01',
                    views: 3 // Overwritten by existing value + new value (using custom expression)
                });
            }
        } catch (err) {
            throw new Error(err);
        }
    })));

    it("should default to existing behaviour when no expression given in PostgreSQL and SQLite", () => Promise.all(connections.map(async connection => {
        try {
            if (connection.driver instanceof PostgresDriver || connection.driver instanceof AbstractSqliteDriver) {
                const DailyStatsRepository = connection.manager.getRepository(DailyStats);

                await DailyStatsRepository
                    .createQueryBuilder()
                    .insert()
                    .into(DailyStats)
                    .values({feedItemId: 1, date: '2021-01-01', views: 1})
                    .execute();

                await DailyStatsRepository
                    .createQueryBuilder()
                    .insert()
                    .into(DailyStats)
                    .values({feedItemId: 1, date: '2021-01-01', views: 2})
                    .orUpdate([{column: 'views'}], ['feedItemId', 'date'])
                    .execute();

                expect(await DailyStatsRepository.count()).to.be.eql(1); // Ensure no new row added
                expect(await DailyStatsRepository.findOneOrFail()).to.be.eql({
                    feedItemId: 1,
                    date: '2021-01-01',
                    views: 2 // Overwritten by value (no custom expression)
                });
            }
        } catch (err) {
            throw new Error(err);
        }
    })));
});
