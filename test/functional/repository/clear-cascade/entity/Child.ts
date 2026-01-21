import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
} from "../../../../../src"
import { Parent } from "./Parent"

@Entity()
export class Child {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    value: string

    @ManyToOne(() => Parent, (parent) => parent.children)
    @JoinColumn({ name: "parent_id" })
    parent: Parent
}
