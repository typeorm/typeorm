import { DataSource } from "../../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { City } from "./entity/city"
import { Country } from "./entity/country"
import { Order } from "./entity/order"
import { User } from "./entity/user"

describe("decorators > foreign-key", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    describe("basic functionality", function () {
        it("should persist and load entities", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    await dataSource.getRepository(Country).save([
                        { code: "US", name: "United States" },
                        { code: "UA", name: "Ukraine" },
                    ])

                    await dataSource.getRepository(City).save([
                        { id: 1, name: "New York", countryCode: "US" },
                        { id: 2, name: "Kiev", countryCode: "UA" },
                    ])

                    await dataSource.getRepository(User).save([
                        {
                            id: 1,
                            name: "Alice",
                            uuid: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
                        },
                        {
                            id: 2,
                            name: "Bob",
                            uuid: "c9bf9e57-1685-4c89-bafb-ff5af830be8a",
                        },
                    ])

                    await dataSource.getRepository(Order).save([
                        {
                            id: 1,
                            userUuid: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
                            cityId: 1,
                            countryCode: "US",
                            dispatchCityId: 1,
                            dispatchCountryCode: "US",
                        },
                        {
                            id: 2,
                            userUuid: "c9bf9e57-1685-4c89-bafb-ff5af830be8a",
                            cityId: 2,
                            countryCode: "UA",
                            dispatchCityId: 1,
                            dispatchCountryCode: "US",
                        },
                    ])

                    const ordersViaQueryBuilder = await dataSource
                        .createQueryBuilder(Order, "orders")
                        .leftJoinAndSelect(
                            User,
                            "users",
                            "users.uuid = orders.userUuid",
                        )
                        .leftJoinAndSelect(
                            Country,
                            "country",
                            "country.code = orders.countryCode",
                        )
                        .leftJoinAndSelect(
                            "cities",
                            "city",
                            "city.id = orders.cityId",
                        )
                        .leftJoinAndSelect(
                            "orders.dispatchCountry",
                            "dispatchCountry",
                        )
                        .leftJoinAndSelect(
                            "orders.dispatchCity",
                            "dispatchCity",
                        )
                        .orderBy("orders.id", "ASC")
                        .getRawMany()

                    ordersViaQueryBuilder.length.should.be.eql(2)

                    ordersViaQueryBuilder.should.be.eql([
                        {
                            orders_id: 1,
                            orders_user_uuid:
                                "f47ac10b-58cc-4372-a567-0e02b2c3d479",
                            orders_countryCode: "US",
                            orders_cityId: 1,
                            orders_dispatchCountryCode: "US",
                            orders_dispatchCityId: 1,
                            users_ref: 1,
                            users_uuid: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
                            country_code: "US",
                            country_name: "United States",
                            city_id: 1,
                            city_countryCode: "US",
                            city_name: "New York",
                            dispatchCountry_code: "US",
                            dispatchCountry_name: "United States",
                            dispatchCity_id: 1,
                            dispatchCity_countryCode: "US",
                            dispatchCity_name: "New York",
                        },
                        {
                            orders_id: 2,
                            orders_user_uuid:
                                "c9bf9e57-1685-4c89-bafb-ff5af830be8a",
                            orders_countryCode: "UA",
                            orders_cityId: 2,
                            orders_dispatchCountryCode: "US",
                            orders_dispatchCityId: 1,
                            users_ref: 2,
                            users_uuid: "c9bf9e57-1685-4c89-bafb-ff5af830be8a",
                            country_code: "UA",
                            country_name: "Ukraine",
                            city_id: 2,
                            city_countryCode: "UA",
                            city_name: "Kiev",
                            dispatchCountry_code: "US",
                            dispatchCountry_name: "United States",
                            dispatchCity_id: 1,
                            dispatchCity_countryCode: "US",
                            dispatchCity_name: "New York",
                        },
                    ])

                    const ordersViaFind = await dataSource
                        .getRepository(Order)
                        .find({
                            relations: {
                                dispatchCountry: true,
                                dispatchCity: true,
                            },
                            order: { id: "asc" },
                        })

                    ordersViaFind.length.should.be.eql(2)

                    ordersViaFind.should.be.eql([
                        {
                            id: 1,
                            userUuid: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
                            countryCode: "US",
                            cityId: 1,
                            dispatchCountryCode: "US",
                            dispatchCityId: 1,
                            dispatchCountry: {
                                code: "US",
                                name: "United States",
                            },
                            dispatchCity: {
                                id: 1,
                                countryCode: "US",
                                name: "New York",
                            },
                        },
                        {
                            id: 2,
                            userUuid: "c9bf9e57-1685-4c89-bafb-ff5af830be8a",
                            countryCode: "UA",
                            cityId: 2,
                            dispatchCountryCode: "US",
                            dispatchCityId: 1,
                            dispatchCountry: {
                                code: "US",
                                name: "United States",
                            },
                            dispatchCity: {
                                id: 1,
                                countryCode: "US",
                                name: "New York",
                            },
                        },
                    ])
                }),
            ))
    })
})
