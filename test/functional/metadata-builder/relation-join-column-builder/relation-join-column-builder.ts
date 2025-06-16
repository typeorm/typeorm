import { expect } from "chai"

import { DataSource } from "../../../../src"

import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { City } from "./entity/City"
import { Country } from "./entity/Country"
import { Order } from "./entity/Order"

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
                    { id: 1, name: "Japan" },
                    { id: 2, name: "England" },
                ])

                await dataSource.getRepository(City).save([
                    { id: 1, countryId: 1, name: "Tokyo" },
                    { id: 2, countryId: 1, name: "Osaka" },
                    { id: 3, countryId: 2, name: "London" },
                    { id: 4, countryId: 2, name: "Manchester" },
                    { id: 5, countryId: 2, name: "Liverpool" },
                ])

                await dataSource.getRepository(Order).save([
                    { id: 1, countryId: 1, cityId: 1 },
                    { id: 2, countryId: 2, cityId: 4 },
                ])

                const orders = await dataSource.getRepository(Order).find({
                    relations: { city: true, country: true },
                    order: { id: "asc" },
                })

                expect(orders).to.deep.members([
                    {
                        id: 1,
                        countryId: 1,
                        cityId: 1,
                        city: { id: 1, countryId: 1, name: "Tokyo" },
                        country: { id: 1, name: "Japan" },
                    },
                    {
                        id: 2,
                        countryId: 2,
                        cityId: 4,
                        city: { id: 4, countryId: 2, name: "Manchester" },
                        country: { id: 2, name: "England" },
                    },
                ])
            }),
        ))
})
