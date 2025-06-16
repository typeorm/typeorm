import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from "../../../../../src"
import { City } from "./City"
import { Country } from "./Country"

@Entity()
export class Order {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    countryId: number

    @ManyToOne(() => Country)
    @JoinColumn({ name: "countryId" })
    country?: Country

    @Column()
    cityId: number

    @ManyToOne(() => City)
    @JoinColumn([
        { name: "cityId", referencedColumnName: "id" },
        { name: "countryId", referencedColumnName: "countryId" },
    ])
    city?: City
}
