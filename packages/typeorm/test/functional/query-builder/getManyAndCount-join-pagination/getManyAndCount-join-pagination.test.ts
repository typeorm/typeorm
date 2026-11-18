import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import type { DataSource } from "../../../../src/data-source/DataSource"
import { expect } from "chai"
import { Sport } from "./entity/Sport"
import { Player } from "./entity/Player"

describe("query builder > getManyAndCount with join + pagination", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [Sport, Player],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    // https://github.com/typeorm/typeorm/issues/11744
    // getManyAndCount() must return the same count as getCount() when
    // pagination (take) is combined with a join whose rows are unevenly
    // distributed (one root with 0 joined rows, another with 2+) and the query
    // orders by the joined column. A single count query is the source of truth;
    // the paginated page size must not be used to infer it.
    it("should return the same count as getCount() with take + join + order on the joined column", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const soccer = await dataSource.manager.save(
                    Object.assign(new Sport(), { name: "soccer" }),
                )
                // tennis intentionally has no players (0 joined rows)
                await dataSource.manager.save(
                    Object.assign(new Sport(), { name: "tennis" }),
                )
                await dataSource.manager.save([
                    Object.assign(new Player(), {
                        name: "Alice",
                        sportId: soccer.id,
                    }),
                    Object.assign(new Player(), {
                        name: "Bob",
                        sportId: soccer.id,
                    }),
                ])

                const buildQuery = () =>
                    dataSource
                        .createQueryBuilder(Sport, "sports")
                        .leftJoinAndSelect("sports.players", "players")
                        .addOrderBy("players.name", "DESC")
                        .take(2)

                const expectedCount = await buildQuery().getCount()
                const [, count] = await buildQuery().getManyAndCount()

                // two sports exist, so the count must be 2 and agree with getCount()
                expect(expectedCount).to.equal(2)
                expect(count).to.equal(expectedCount)
            }),
        ))

    // https://github.com/typeorm/typeorm/issues/11744
    // The same truncation happens when the joined column is ordered through a
    // select alias (addSelect("players.name", "playerName").orderBy("playerName")),
    // so the count fallback must resolve select aliases to their selection.
    it("should return the same count as getCount() when ordering by a joined column via a select alias", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const soccer = await dataSource.manager.save(
                    Object.assign(new Sport(), { name: "soccer" }),
                )
                await dataSource.manager.save(
                    Object.assign(new Sport(), { name: "tennis" }),
                )
                await dataSource.manager.save([
                    Object.assign(new Player(), {
                        name: "Alice",
                        sportId: soccer.id,
                    }),
                    Object.assign(new Player(), {
                        name: "Bob",
                        sportId: soccer.id,
                    }),
                ])

                const buildQuery = () =>
                    dataSource
                        .createQueryBuilder(Sport, "sports")
                        .leftJoin("sports.players", "players")
                        .addSelect("players.name", "playerName")
                        .orderBy("playerName", "DESC")
                        .take(2)

                const expectedCount = await buildQuery().getCount()
                const [, count] = await buildQuery().getManyAndCount()

                expect(expectedCount).to.equal(2)
                expect(count).to.equal(expectedCount)
            }),
        ))

    // https://github.com/typeorm/typeorm/issues/11744
    // A computed select alias whose expression starts with the main alias but
    // still references a joined column (e.g. addSelect("sports.id + players.id",
    // "sortKey")) also splits the pagination DISTINCT per joined row. Inspecting
    // only the first alias token would wrongly treat it as safe, so the lazy
    // count shortcut must be disabled for anything that is not a plain
    // main-alias column.
    it("should return the same count as getCount() when ordering by a computed select alias over a joined column", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const soccer = await dataSource.manager.save(
                    Object.assign(new Sport(), { name: "soccer" }),
                )
                await dataSource.manager.save(
                    Object.assign(new Sport(), { name: "tennis" }),
                )
                await dataSource.manager.save([
                    Object.assign(new Player(), {
                        name: "Alice",
                        sportId: soccer.id,
                    }),
                    Object.assign(new Player(), {
                        name: "Bob",
                        sportId: soccer.id,
                    }),
                ])

                const buildQuery = () =>
                    dataSource
                        .createQueryBuilder(Sport, "sports")
                        .leftJoinAndSelect("sports.players", "players")
                        .addSelect("sports.id + players.id", "sortKey")
                        .orderBy("sortKey", "DESC")
                        .take(2)

                const expectedCount = await buildQuery().getCount()
                const [, count] = await buildQuery().getManyAndCount()

                expect(expectedCount).to.equal(2)
                expect(count).to.equal(expectedCount)
            }),
        ))
})
