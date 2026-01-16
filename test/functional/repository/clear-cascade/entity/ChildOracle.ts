import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
} from "../../../../../src"
import { ParentOracle } from "./ParentOracle"

@Entity()
export class ChildOracle {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    value: string

    @ManyToOne(() => ParentOracle, (parent) => parent.children, {
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "parent_id" })
    parent: ParentOracle
}
