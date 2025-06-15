import { Column, Entity, PrimaryColumn } from "../../../../src"

@Entity({ name: "M_CITY" })
export class CityModel {
    @PrimaryColumn({ name: "CITY_ID" })
    id: string

    @PrimaryColumn({ name: "PREF_ID" })
    prefId: string

    @Column({ name: "CITY_NAME" })
    name: string
}
