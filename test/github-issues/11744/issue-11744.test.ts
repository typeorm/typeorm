import "reflect-metadata"
import {
    createTestingConnections,
    closeTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import type { DataSource } from "../../../src/data-source/DataSource"
import { expect } from "chai"
import { Sport } from "./entity/Sport"
import { Player } from "./entity/Player"

describe("github issues > #11744 getManyAndCount returns wrong count with take() + join when a parent has 0 and another has 2+ joined rows", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    beforeEach(async () => {
        await reloadTestingDatabases(dataSources)
        await Promise.all(
            dataSources.map(async (dataSource) => {
                const sportRepo = dataSource.getRepository(Sport)
                const playerRepo = dataSource.getRepository(Player)

                // Sport with zero players
                const basketball = await sportRepo.save(
                    sportRepo.create({ name: "Basketball" }),
                )

                // Sport with two players
                const soccer = await sportRepo.save(
                    sportRepo.create({ name: "Soccer" }),
                )
                await playerRepo.save([
                    playerRepo.create({ name: "Alice", sport: soccer }),
                    playerRepo.create({ name: "Zoe", sport: soccer }),
                ])

                void basketball
            }),
        )
    })
    after(() => closeTestingConnections(dataSources))

    it("should return the correct count of parent entities", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const [, count] = await dataSource
                    .getRepository(Sport)
                    .createQueryBuilder("sports")
                    .leftJoinAndSelect("sports.players", "players")
                    .addOrderBy("players.name", "DESC")
                    .take(2)
                    .getManyAndCount()

                // Two sports exist (Basketball with 0 players, Soccer with 2
                // players); the count must reflect both regardless of how many
                // joined rows each parent has.
                expect(count).to.equal(2)
            }),
        ))

    it("should return the correct count of parent entities with skip and a join", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const [, count] = await dataSource
                    .getRepository(Sport)
                    .createQueryBuilder("sports")
                    .leftJoinAndSelect("sports.players", "players")
                    .addOrderBy("players.name", "DESC")
                    .skip(1)
                    .getManyAndCount()

                // Same root cause as the take() case: with a join, skip is
                // applied through the distinct-id sub-query over (primaryKey,
                // order-by) tuples, so it may skip fewer distinct parents than
                // its value and the derived count overcounts. The count must
                // still reflect the two real parents.
                expect(count).to.equal(2)
            }),
        ))
})
