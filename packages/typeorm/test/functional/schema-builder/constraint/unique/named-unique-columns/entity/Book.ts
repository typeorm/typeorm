import {
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryColumn,
} from "../../../../../../../src"
import { Shelf } from "./Shelf"

@Entity()
export class Book {
    @PrimaryColumn()
    id: number

    @ManyToOne(() => Shelf)
    @JoinColumn([
        { name: "shelf_room", referencedColumnName: "room" },
        { name: "shelf_slot", referencedColumnName: "slot" },
    ])
    shelf: Shelf
}
