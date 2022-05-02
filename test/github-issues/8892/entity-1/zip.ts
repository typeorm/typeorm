import { Entity, ManyToMany, PrimaryColumn, RelationId } from "../../../../src"
import { City } from "./city"

@Entity()
export class Zip {
    @PrimaryColumn({ length: 2 })
    countryCode: string

    @PrimaryColumn()
    code: string

    @RelationId((zip: Zip) => zip.cities)
    cityIds: string[]

    @ManyToMany(() => City, (city: City) => city.zips)
    cities: City[]
}
