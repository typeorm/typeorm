import { City } from "./city"
import { Country } from "./country"

export class Order {
    id: number
    userUuid: string
    countryCode: string
    cityId: number
    dispatchCountryCode: string
    dispatchCountry: Country
    dispatchCityId: number
    dispatchCity: City
}
