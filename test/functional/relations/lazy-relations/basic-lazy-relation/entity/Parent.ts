import {
    Entity,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
} from "../../../../../../src"
import { Child } from "./Child"

@Entity()
export class Parent {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @CreateDateColumn()
    createdAt: Date

    @UpdateDateColumn()
    updatedAt: Date

    @OneToMany(() => Child, (child) => child.parent)
    children?: Promise<Array<Child>>
}
