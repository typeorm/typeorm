import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    Unique,
} from "../../../../src"
import { Child } from "./child"
import { Parent } from "./parent"

@Entity("sub_child")
@Unique("UQ_parent_childName", ["parentId", "childName"])
export class SubChild {
    @PrimaryGeneratedColumn("uuid")
    id?: string

    @Column()
    parentId: string

    @Column()
    childName: string

    @ManyToOne(() => Parent)
    @JoinColumn({ name: "parentId", referencedColumnName: "id" })
    parent: Parent

    @OneToMany(() => Child, (item) => item.subChild)
    childs: Child[]
}
