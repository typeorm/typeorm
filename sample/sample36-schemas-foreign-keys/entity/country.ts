import { EntitySchema } from "../../../src"
import { Country } from "../model/country"

export const CountryEntity = new EntitySchema<Country>({
    name: "Country",
    tableName: "countries",
    columns: {
        code: {
            primary: true,
            type: String,
            length: 2,
        },
        name: {
            type: String,
        },
    },
})
