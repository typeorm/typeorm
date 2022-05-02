import { City } from "./city"
import {
    Entity,
    JoinColumn,
    ManyToMany,
    ManyToOne,
    PrimaryColumn,
    RelationId,
} from "../../../../src"
import { Country } from "./country"

@Entity()
export class Zip {
    @RelationId((zip: Zip) => zip.country)
    @PrimaryColumn({ length: 2 })
    countryCode: string

    @ManyToOne(() => Country, (country) => country.zips, {
        createForeignKeyConstraints: true,
    })
    @JoinColumn()
    country: Country

    @PrimaryColumn()
    code: string

    @RelationId((zip: Zip) => zip.cities)
    cityIds: string[]

    @ManyToMany(() => City, (city: City) => city.zips)
    cities: City[]
}
