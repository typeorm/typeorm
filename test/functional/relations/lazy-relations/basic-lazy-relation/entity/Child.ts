import {
    Entity,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from "../../../../../../src"
import { Parent } from "./Parent"

@Entity()
export class Child {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @CreateDateColumn()
    createdAt: Date

    @UpdateDateColumn()
    updatedAt: Date

    @ManyToOne(() => Parent, (parent) => parent.children)
    @JoinColumn({ name: "parentId" })
    parent?: Promise<Parent | null>
}
