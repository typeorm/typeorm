import { Column, Entity, ForeignKey, PrimaryColumn } from "../../../src"
import { City } from "./city"
import { Country } from "./country"

import { User } from "./user"

@Entity("orders")
@ForeignKey(() => City, ["cityId", "countryCode"], ["id", "countryCode"])
export class Order {
    @PrimaryColumn()
    id: number

    @Column("uuid", { name: "user_uuid" })
    @ForeignKey<User>("User", "uuid", { name: "FK_user_uuid" })
    userUuid: string

    @Column({ length: 2 })
    @ForeignKey(() => Country, "code")
    countryCode: string

    @Column()
    @ForeignKey("cities")
    cityId: number
}
