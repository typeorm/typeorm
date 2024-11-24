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
            schema: "foreign-key-decorator-test",
            // schemaCreate: true,
            dropSchema: true,
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
                        },
                        {
                            id: 2,
                            userUuid: "c9bf9e57-1685-4c89-bafb-ff5af830be8a",
                            cityId: 2,
                            countryCode: "UA",
                        },
                    ])

                    await dataSource
                        .createQueryBuilder(Order, "orders")
                        .leftJoinAndSelect(
                            User,
                            "users",
                            "users.uuid = orders.userUuid",
                        )
                        .leftJoinAndSelect(
                            Country,
                            "countries",
                            "countries.code = orders.countryCode",
                        )
                        .leftJoinAndSelect(
                            "cities",
                            "cities",
                            "cities.id = orders.cityId",
                        )
                        .getRawMany()
                }),
            ))
    })
})
