import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToMany,
} from "../../../../src"
import { BigintChild } from "./BigintChild"

@Entity()
export class BigintParent {
    @PrimaryGeneratedColumn({ type: "bigint" })
    id!: string

    @Column()
    name!: string

    @OneToMany(() => BigintChild, (child) => child.parent)
    children!: BigintChild[]
}
