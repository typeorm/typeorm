import { Entity } from "../../../../../src/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "../../../../../src/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "../../../../../src/decorator/columns/Column"
import { ManyToOne } from "../../../../../src/decorator/relations/ManyToOne"
import { OneToMany } from "../../../../../src/decorator/relations/OneToMany"
import { Parent } from "./Parent"
import { GrandChild } from "./GrandChild"

@Entity()
export class Child {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @ManyToOne(() => Parent, (parent) => parent.children)
    parent: Parent

    @OneToMany(() => GrandChild, (gc) => gc.child, {
        cascade: ["insert"],
    })
    grandChildren: GrandChild[]
}
