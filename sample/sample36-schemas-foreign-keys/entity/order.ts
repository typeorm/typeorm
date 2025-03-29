import { EntitySchema } from "../../../src"
import { Order } from "../model/order"
import { CityEntity } from "./city"
import { CountryEntity } from "./country"

export const OrderEntity = new EntitySchema<Order>({
    name: "Order",
    tableName: "orders",
    columns: {
        id: {
            primary: true,
            type: Number,
        },
        userUuid: {
            type: "uuid",
            name: "user_uuid",
            foreignKey: {
                target: "User",
                inverseSide: "uuid",
                name: "FK_user_uuid",
            },
        },
        countryCode: {
            type: String,
            length: 2,
            foreignKey: {
                target: CountryEntity,
                inverseSide: "code",
            },
        },
        cityId: {
            type: Number,
            foreignKey: {
                target: "cities",
            },
        },
        dispatchCountryCode: {
            type: String,
            length: 2,
        },
        dispatchCityId: {
            type: Number,
        },
    },
    relations: {
        dispatchCountry: {
            type: "many-to-one",
            target: () => "Country",
            joinColumn: {
                name: "dispatchCountryCode",
            },
        },
        dispatchCity: {
            type: "many-to-one",
            target: CityEntity,
            joinColumn: {
                name: "dispatchCityId",
            },
        },
    },
    foreignKeys: [
        {
            target: CityEntity,
            columnNames: ["cityId", "countryCode"],
            referencedColumnNames: ["id", "countryCode"],
        },
    ],
})
