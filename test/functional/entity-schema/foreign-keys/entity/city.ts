import { EntitySchema } from "../../../../../src"
import { City } from "../model/city"

import { CountryEntity } from "./country"

export const CityEntity = new EntitySchema<City>({
    name: "City",
    tableName: "cities",
    columns: {
        id: {
            primary: true,
            type: Number,
        },
        countryCode: {
            type: String,
            length: 2,
            foreignKey: {
                target: CountryEntity,
                onDelete: "CASCADE",
                onUpdate: "CASCADE",
            },
        },
        name: {
            type: String,
        },
    },
    uniques: [
        {
            columns: ["id", "countryCode"],
        },
    ],
})
