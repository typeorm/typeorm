import {
    Column,
    Entity,
    ForeignKey,
    PrimaryColumn,
    Unique,
} from "../../../../../src"

@Entity("cities")
@Unique(["id", "countryCode"])
export class City {
    @PrimaryColumn()
    id: number

    @Column()
    @ForeignKey("countries", { onDelete: "CASCADE", onUpdate: "CASCADE" })
    countryCode: string
}
