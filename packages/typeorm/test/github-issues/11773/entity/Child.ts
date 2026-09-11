import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryColumn,
} from "../../../../src"
import { Parent } from "./Parent"

@Entity()
export class Child {
    @PrimaryColumn({ type: "bigint" })
    id: number

    @Column({ type: "bigint", nullable: true })
    parentId: number | null

    @ManyToOne(() => Parent, (parent) => parent.children)
    @JoinColumn({ name: "parentId" })
    parent: Parent | null
}
