import { Entity } from "../../../../../src/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "../../../../../src/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "../../../../../src/decorator/columns/Column"
import { ManyToOne } from "../../../../../src/decorator/relations/ManyToOne"
import { OneToMany } from "../../../../../src/decorator/relations/OneToMany"
import { Parent } from "./Parent"
import { GrandChild } from "./GrandChild"
import { ChildEntity, TableInheritance } from "../../../../../src"

@Entity()
@TableInheritance({ column: "type" })
export class Child {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    type: string

    @Column()
    name: string

    @ManyToOne(() => Parent, (parent) => parent.children, { nullable: false })
    parent: Parent

    @OneToMany(() => GrandChild, (gc) => gc.child, {
        cascade: ["insert"],
    })
    grandChildren: GrandChild[]
}

@ChildEntity("one")
export class ChildOne extends Child {
    readonly type = "one"
}

@ChildEntity("two")
export class ChildTwo extends Child {
    readonly type = "two"
}
