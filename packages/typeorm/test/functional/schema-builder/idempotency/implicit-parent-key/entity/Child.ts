import {
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryColumn,
} from "../../../../../../src"
import { Parent } from "./Parent"

@Entity()
export class Child {
    @PrimaryColumn()
    id: number

    @ManyToOne(() => Parent)
    @JoinColumn({ name: "parent_id" })
    parent: Parent
}
