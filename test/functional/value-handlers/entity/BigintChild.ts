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
    @PrimaryGeneratedColumn()
    id!: number

    @Column()
    label!: string

    @ManyToOne(() => BigintParent, (parent) => parent.children)
    @JoinColumn()
    parent!: BigintParent
}
