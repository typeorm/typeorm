import {
    Column,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn,
} from "typeorm"
import { Child } from "./Child"

@Entity()
export class Parent {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name?: string

    @OneToMany(() => Child, (child) => child.parent)
    children?: Child[]
}
