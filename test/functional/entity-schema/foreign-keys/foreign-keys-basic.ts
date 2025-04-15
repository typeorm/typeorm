import { DataSource, TableForeignKey } from "../../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { CityEntity } from "./entity/city"
import { CountryEntity } from "./entity/country"
import { OrderEntity } from "./entity/order"
import { UserEntity } from "./entity/user"

describe("entity-schema > foreign-keys", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    describe("basic functionality", () => {
        it("should create a foreign keys", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const queryRunner = dataSource.createQueryRunner()
                    const citiesTable = await queryRunner.getTable("cities")
                    const ordersTable = await queryRunner.getTable("orders")
                    await queryRunner.release()

                    const narrowForeignKeys = (
                        foreignKeys: TableForeignKey[],
                    ) =>
                        foreignKeys.map((foreignKey) => {
                            const {
                                columnNames,
                                referencedColumnNames,
                                referencedTableName,
                                onDelete,
                                onUpdate,
                            } = foreignKey

                            return {
                                columnNames: columnNames.sort(),
                                referencedColumnNames:
                                    referencedColumnNames.sort(),
                                referencedTableName,
                                onDelete,
                                onUpdate,
                            }
                        })

                    const citiesForeignKeys = narrowForeignKeys(
                        citiesTable!.foreignKeys,
                    )

                    citiesForeignKeys.length.should.be.equal(1)
                    citiesForeignKeys.should.include.deep.members([
                        {
                            columnNames: ["countryCode"],
                            referencedColumnNames: ["code"],
                            referencedTableName: "countries",
                            onDelete: "CASCADE",
                            onUpdate:
                                dataSource.driver.options.type === "oracle"
                                    ? "NO ACTION"
                                    : "CASCADE",
                        },
                    ])

                    ordersTable!.foreignKeys.length.should.be.equal(6)
                    const ordersUsersFK = ordersTable!.foreignKeys.find(
                        ({ name }) => name === "FK_user_uuid",
                    )

                    ordersUsersFK!.should.be.deep.include({
                        columnNames: ["user_uuid"],
                        referencedColumnNames: ["uuid"],
                        referencedTableName: "users",
                        name: "FK_user_uuid",
                        onDelete: "NO ACTION",
                        onUpdate: "NO ACTION",
                    })

                    const ordersForeignKeys = narrowForeignKeys(
                        ordersTable!.foreignKeys,
                    )

                    ordersForeignKeys.should.include.deep.members([
                        {
                            columnNames: ["countryCode"],
                            referencedColumnNames: ["code"],
                            referencedTableName: "countries",
                            onDelete: "NO ACTION",
                            onUpdate: "NO ACTION",
                        },
                        {
                            columnNames: ["dispatchCountryCode"],
                            referencedColumnNames: ["code"],
                            referencedTableName: "countries",
                            onDelete: "NO ACTION",
                            onUpdate: "NO ACTION",
                        },
                        {
                            columnNames: ["cityId", "countryCode"],
                            referencedColumnNames: ["countryCode", "id"],
                            referencedTableName: "cities",
                            onDelete: "NO ACTION",
                            onUpdate: "NO ACTION",
                        },
                        {
                            columnNames: ["cityId"],
                            referencedColumnNames: ["id"],
                            referencedTableName: "cities",
                            onDelete: "NO ACTION",
                            onUpdate: "NO ACTION",
                        },
                        {
                            columnNames: ["dispatchCityId"],
                            referencedColumnNames: ["id"],
                            referencedTableName: "cities",
                            onDelete: "NO ACTION",
                            onUpdate: "NO ACTION",
                        },
                    ])
                }),
            ))

        it("should persist and load entities", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
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
                        .leftJoinAndSelect(
                            "User",
                            "users",
                            "users.uuid = orders.userUuid",
                        )
                        .leftJoinAndSelect(
                            "Country",
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
                        .then((orders) =>
                            orders.map(
                                ({
                                    orders_id,
                                    orders_cityId,
                                    orders_dispatchCityId,
                                    orders_user_uuid,
                                    users_ref,
                                    users_uuid,
                                    city_id,
                                    dispatchCity_id,
                                    ...order
                                }) => ({
                                    orders_id: parseInt(orders_id),
                                    orders_cityId: parseInt(orders_cityId),
                                    orders_dispatchCityId: parseInt(
                                        orders_dispatchCityId,
                                    ),
                                    orders_user_uuid:
                                        orders_user_uuid.toLowerCase(),
                                    users_ref: parseInt(users_ref),
                                    users_uuid: users_uuid.toLowerCase(),
                                    city_id: parseInt(city_id),
                                    dispatchCity_id: parseInt(dispatchCity_id),
                                    ...order,
                                }),
                            ),
                        )

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
                        .getRepository(OrderEntity)
                        .find({
                            relations: {
                                dispatchCountry: true,
                                dispatchCity: true,
                            },
                            order: { id: "asc" },
                        })
                        .then((orders) =>
                            orders.map(({ userUuid, ...order }) => ({
                                userUuid: userUuid.toLowerCase(),
                                ...order,
                            })),
                        )

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
