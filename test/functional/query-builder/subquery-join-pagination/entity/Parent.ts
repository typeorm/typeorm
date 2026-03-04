import { Entity } from "../../../../../src/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "../../../../../src/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "../../../../../src/decorator/columns/Column"
import { OneToMany } from "../../../../../src/decorator/relations/OneToMany"
import { Child } from "./Child"

@Entity()
export class Parent {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ nullable: true })
    name: string

    @OneToMany(() => Child, (child) => child.parent)
    children: Child[]
}
