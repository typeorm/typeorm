import { DataSource, DataSourceOptions } from "../../src"
import { CityEntity } from "./entity/city"
import { CountryEntity } from "./entity/country"
import { OrderEntity } from "./entity/order"
import { UserEntity } from "./entity/user"

const options: DataSourceOptions = {
    type: "postgres",
    host: "localhost",
    port: 5432,
    username: "test",
    password: "test",
    database: "test",
    logging: false,
    synchronize: true,
    entities: [CityEntity, CountryEntity, OrderEntity, UserEntity],
}

const dataSource = new DataSource(options)
dataSource.initialize().then(
    async (dataSource) => {
        await dataSource.getRepository(CountryEntity).save([
            { code: "US", name: "United States" },
            { code: "UA", name: "Ukraine" },
        ])

        await dataSource.getRepository(CityEntity).save([
            { id: 1, name: "New York", countryCode: "US" },
            { id: 2, name: "Kiev", countryCode: "UA" },
        ])

        await dataSource.getRepository(UserEntity).save([
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

        await dataSource.getRepository(OrderEntity).save([
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
            .createQueryBuilder(OrderEntity, "orders")
            .leftJoinAndSelect("User", "users", "users.uuid = orders.userUuid")
            .leftJoinAndSelect(
                "Country",
                "country",
                "country.code = orders.countryCode",
            )
            .leftJoinAndSelect("cities", "city", "city.id = orders.cityId")
            .leftJoinAndSelect("orders.dispatchCountry", "dispatchCountry")
            .leftJoinAndSelect("orders.dispatchCity", "dispatchCity")
            .orderBy("orders.id", "ASC")
            .getRawMany()

        console.log(ordersViaQueryBuilder)

        const ordersViaFind = await dataSource.getRepository(OrderEntity).find({
            relations: {
                dispatchCountry: true,
                dispatchCity: true,
            },
            order: { id: "asc" },
        })

        console.log(ordersViaFind)
    },
    (error) => console.log("Cannot connect: ", error),
)
