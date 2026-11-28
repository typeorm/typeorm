import { Column, Entity, PrimaryColumn, Unique } from "../../../../../../../src"

@Entity()
@Unique("slot_once", ["room", "start"])
export class Slot {
    @PrimaryColumn()
    id: number

    @Column()
    room: string

    @Column()
    start: string
}
