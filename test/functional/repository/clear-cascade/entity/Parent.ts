import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToMany,
} from "../../../../../src"
import { Child } from "./Child"

@Entity()
export class Parent {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @OneToMany(() => Child, (child) => child.parent)
    children: Child[]
}
