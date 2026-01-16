import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
} from "../../../../../src"
import { ParentOracle } from "./ParentOracle"

@Entity()
export class ChildNoDelete {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    value: string

    @ManyToOne(() => ParentOracle, (parent) => parent.children)
    @JoinColumn({ name: "parent_id" })
    parent: ParentOracle
}
