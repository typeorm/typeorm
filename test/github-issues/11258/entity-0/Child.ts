import { Column, Entity, ManyToOne } from "../../../../src"
import { BaseEntity } from "./Base"
import { Parent } from "./Parent"

@Entity({ name: "child_precision_0" })
export class Child extends BaseEntity {
    @Column({ type: "varchar", length: 255 })
    name?: string

    @ManyToOne(() => Parent, (parent) => parent.entities)
    parent?: Parent
}
