import {
    Column,
    Entity,
    JoinColumn,
    OneToOne,
    PrimaryGeneratedColumn,
} from "../../../../src"
import CityModel from "./city"
import PrefModel from "./pref"

@Entity({ name: "M_ESTATE" })
export default class EstateModel {
    @PrimaryGeneratedColumn({ name: "ESTATE_ID" })
    id!: number

    @Column({
        name: "ESTATE_NAME",
        type: "varchar",
        length: 100,
        nullable: false,
    })
    name!: string

    @Column({ name: "PREF_ID", comment: "都道府県ID" })
    prefId!: string

    @Column({ name: "CITY_ID", type: "varchar", comment: "市区ID" })
    cityId!: string | null

    @OneToOne(() => CityModel)
    @JoinColumn([
        { name: "CITY_ID", referencedColumnName: "id" },
        { name: "PREF_ID", referencedColumnName: "prefId" },
    ])
    city!: CityModel | null

    @OneToOne(() => PrefModel)
    @JoinColumn([{ name: "PREF_ID", referencedColumnName: "id" }])
    pref!: PrefModel | null
}
