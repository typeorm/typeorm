import {
    Column,
    Entity,
    ForeignKey,
    PrimaryColumn,
    Unique,
} from "../../../../src"

@Entity("wrong_cities")
@Unique(["id", "countryCode"])
export class WrongCity {
    @PrimaryColumn()
    id: number

    @Column({ length: 2 })
    @ForeignKey("countries", "id", { onDelete: "CASCADE", onUpdate: "CASCADE" })
    countryCode: string

    @Column()
    name: string
}
