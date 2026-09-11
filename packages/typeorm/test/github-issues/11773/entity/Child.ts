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
    // The child's own PK is the bigint that some drivers hydrate as a string.
    @PrimaryColumn({ type: "bigint" })
    id: number

    // FK matches the parent's int PK; it is the column that was nulled.
    @Column({ type: "int", nullable: true })
    parentId: number | null

    @ManyToOne(() => Parent, (parent) => parent.children)
    @JoinColumn({ name: "parentId" })
    parent: Parent | null
}
