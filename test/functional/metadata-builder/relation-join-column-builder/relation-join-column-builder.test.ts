import { expect } from "chai"

import { DataSource } from "../../../../src"

import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { City } from "./entity/City"
import { Country } from "./entity/Country"
import { Company } from "./entity/Company"
import { Game } from "./entity/Game"
import { Match } from "./entity/Match"
import { Participant } from "./entity/Participant"

describe("metadata builder > RelationJoinColumnBuilder", () => {
    let dataSources: DataSource[]

    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should not throw error when loading entities with composite FK with shared columns", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await dataSource.getRepository(Country).save([
                    { name: "Texas", region: "USA" },
                    { name: "France", region: "EU" },
                ] satisfies Country[])

                await dataSource.getRepository(City).save([
                    {
                        name: "Paris",
                        countryName: "France",
                        population: 2_100_000,
                    },
                    {
                        name: "Paris",
                        countryName: "Texas",
                        population: 25_000,
                    },
                    {
                        name: "Strasbourg",
                        countryName: "France",
                        population: 270_000,
                    },
                    {
                        name: "Lyon",
                        countryName: "France",
                        population: 720_000,
                    },
                    {
                        name: "Houston",
                        countryName: "Texas",
                        population: 2_300_000,
                    },
                ] satisfies City[])

                await dataSource.getRepository(Company).save([
                    { name: "NASA", countryName: "Texas", cityName: "Houston" },
                    { name: "AXA", countryName: "France", cityName: "Paris" },
                ] satisfies Company[])

                const companies = await dataSource.getRepository(Company).find({
                    relations: { city: true, country: true },
                    order: { name: "asc" },
                })

                expect(companies).to.deep.members([
                    {
                        name: "AXA",
                        countryName: "France",
                        cityName: "Paris",
                        city: {
                            countryName: "France",
                            name: "Paris",
                            population: 2_100_000,
                        },
                        country: { name: "France", region: "EU" },
                    },
                    {
                        name: "NASA",
                        countryName: "Texas",
                        cityName: "Houston",
                        city: {
                            countryName: "Texas",
                            name: "Houston",
                            population: 2_300_000,
                        },
                        country: { name: "Texas", region: "USA" },
                    },
                ] satisfies Company[])
            }),
        ))

    it("should correctly generate sql with simple and composite joins (referenceColumnNames)", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const game = await dataSource.getRepository(Game).save({
                    id: 1,
                })
                const participant = await dataSource
                    .getRepository(Participant)
                    .save({
                        userId: 1,
                        gameId: 1,
                    })

                await dataSource.getRepository(Match).save({
                    id: 1,
                    game: game,
                    userId: 1,
                    participant: participant,
                })

                const query = dataSource
                    .createQueryBuilder(Match, "match")
                    .leftJoinAndSelect("match.game", "game")
                    .leftJoinAndSelect("match.participant", "participant")

                const sql = query.getSql()

                const hasCorrectJoin =
                    sql.includes(
                        "LEFT JOIN `game` `game` ON `game`.`id`=`match`.`game_id`  LEFT JOIN `participant` `participant` ON `participant`.`user_id`=`match`.`user_id` AND `participant`.`game_id`=`match`.`game_id`",
                    ) ||
                    sql.includes(
                        `LEFT JOIN "game" "game" ON "game"."id"="match"."game_id"  LEFT JOIN "participant" "participant" ON "participant"."user_id"="match"."user_id" AND "participant"."game_id"="match"."game_id"`,
                    )
                expect(hasCorrectJoin).to.be.true

                const matches = await query.getMany()
                expect(matches).to.deep.equal([
                    {
                        id: 1,
                        game: {
                            id: 1,
                        },
                        userId: 1,
                        participant: {
                            userId: 1,
                            gameId: 1,
                        },
                    },
                ])
            }),
        ))
})
