import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToOne,
    PrimaryGeneratedColumn,
} from "../../../../src"
import { Parent } from "./parent"
import { SubChild } from "./sub-child"

@Entity("child")
export class Child {
    @PrimaryGeneratedColumn("uuid")
    id?: string

    @Column({ name: "parent_id", nullable: false })
    parentId: string

    @Column({ name: "sub_child_name", nullable: false })
    subChildName: string

    @OneToOne(() => Parent, (item) => item.child, { onDelete: "CASCADE" })
    @JoinColumn({ name: "parent_id", referencedColumnName: "id" })
    parent?: Parent

    @ManyToOne(() => SubChild, (item) => item.childs, { onDelete: "CASCADE" })
    @JoinColumn([
        { name: "parent_id", referencedColumnName: "parentId" },
        { name: "sub_child_name", referencedColumnName: "childName" },
    ])
    subChild?: SubChild
}
