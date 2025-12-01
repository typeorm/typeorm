import { Column, Entity, ForeignKey, PrimaryColumn, Unique } from "../../../src"

@Entity("cities")
@Unique(["id", "countryCode"])
export class City {
    @PrimaryColumn()
    id: number

    @Column({ length: 2 })
    @ForeignKey("countries", { onDelete: "CASCADE", onUpdate: "CASCADE" })
    countryCode: string

    @Column()
    name: string
}
