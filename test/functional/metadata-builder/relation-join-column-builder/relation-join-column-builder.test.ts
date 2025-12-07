import {
    expect,
    describe,
    afterAll,
    it,
    beforeAll as before,
    beforeEach,
    afterAll as after,
    afterEach,
} from "vitest"

import { DataSource } from "../../../../src"

import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { City } from "./entity/City"
import { Country } from "./entity/Country"
import { Company } from "./entity/Company"

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
})
