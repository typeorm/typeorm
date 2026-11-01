import { Entity, PrimaryColumn, ManyToOne, JoinColumn } from "../../../../src"
import { Parent } from "./Parent"

@Entity()
export class Comp {
    @ManyToOne(() => Parent, (p) => p.comp)
    @JoinColumn({ name: "parent_id" })
    parent: Parent

    @PrimaryColumn({ name: "parent_id" })
    parentId: string
}
