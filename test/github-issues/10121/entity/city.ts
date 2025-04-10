import { Column, Entity, PrimaryColumn } from "../../../../src"

@Entity({ name: "M_CITY" })
export default class CityModel {
    @PrimaryColumn({ name: "CITY_ID", nullable: false })
    id!: string

    @PrimaryColumn({ name: "PREF_ID", nullable: false })
    prefId!: string

    @Column({ name: "CITY_NAME", nullable: false })
    name!: string
}
