import {
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryColumn,
} from "../../../../../../../src"
import { Slot } from "./Slot"

@Entity()
export class Reservation {
    @PrimaryColumn()
    id: number

    @ManyToOne(() => Slot)
    @JoinColumn([
        { name: "slot_room", referencedColumnName: "room" },
        { name: "slot_start", referencedColumnName: "start" },
    ])
    slot: Slot
}
