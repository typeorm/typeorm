import { Column, Entity, PrimaryColumn, Unique } from "../../../../../../../src"

@Entity()
@Unique("shelf_spot", ["room", "slot"])
@Unique("shelf_pair", ["room", "level"])
export class Shelf {
    @PrimaryColumn()
    id: number

    @Column()
    room: string

    @Column()
    slot: string

    @Column()
    level: string
}
