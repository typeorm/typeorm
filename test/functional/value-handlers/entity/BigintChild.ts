import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
} from "../../../../src"
import { BigintParent } from "./BigintParent"

@Entity()
export class BigintChild {
    @PrimaryGeneratedColumn({ type: "bigint" })
    id!: string

    @Column()
    label!: string

    @ManyToOne(() => BigintParent, (parent) => parent.children)
    @JoinColumn()
    parent!: BigintParent
}
