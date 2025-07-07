import { Column, Entity, OneToMany } from "../../../../src"
import { BaseEntity } from "./Base"
import { Child } from "./Child"

@Entity({ name: "parent_precision_0" })
export class Parent extends BaseEntity {
    @Column({ type: "varchar", length: 255 })
    name?: string

    @OneToMany(() => Child, (child) => child.parent)
    entities?: Child[]
}
