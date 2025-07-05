import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryColumn,
} from "../../../../../src"
import { City } from "./City"
import { Country } from "./Country"

@Entity()
export class Company {
    @PrimaryColumn()
    name: string

    @Column()
    countryName: string

    @ManyToOne(() => Country)
    @JoinColumn({ name: "countryName" })
    country?: Country

    @Column()
    cityName: string

    @ManyToOne(() => City)
    @JoinColumn([
        { name: "cityName", referencedColumnName: "name" },
        { name: "countryName", referencedColumnName: "countryName" },
    ])
    city?: City
}
