import { Column, Entity, PrimaryColumn, Unique } from "../../../../../src"

@Entity()
@Unique(["id", "countryId"])
export class City {
    @PrimaryColumn()
    id: number

    @Column()
    countryId: number

    @Column()
    name: string
}
