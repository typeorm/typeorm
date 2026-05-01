import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToMany,
} from "../../../../src"
import { BigintChild } from "./BigintChild"

@Entity()
export class BigintParent {
    @PrimaryGeneratedColumn()
    id!: number

    @Column()
    name!: string

    @OneToMany(() => BigintChild, (child) => child.parent)
    children!: BigintChild[]
}
