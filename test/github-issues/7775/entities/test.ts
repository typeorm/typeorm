import {
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
} from "../../../../src"

@Entity("parent")
export class Parent {
    @PrimaryGeneratedColumn()
    id: number

    @OneToMany((type) => Child, (child) => child.parent)
    children: Child[]
}

@Entity("child")
export class Child {
    @PrimaryGeneratedColumn()
    id: number

    @ManyToOne((type) => Parent, (parent) => parent.children)
    @JoinColumn({ name: "parent_id" })
    parent: Parent
}
