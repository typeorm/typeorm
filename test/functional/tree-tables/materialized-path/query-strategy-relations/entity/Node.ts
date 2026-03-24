import {
    TreeChildren,
    TreeParent,
    OneToMany,
    Entity,
    PrimaryGeneratedColumn,
    Column,
    Tree,
} from "../../../../../../src"
import { Rule } from "./Rule"

@Entity("node")
@Tree("materialized-path")
export class Node {
    @PrimaryGeneratedColumn()
    id: number

    @Column("varchar")
    name: string

    @OneToMany(() => Rule, (rule) => rule.node, {
        cascade: true,
        onDelete: "CASCADE",
    })
    rules: Rule[]

    @TreeChildren({ cascade: true })
    children: Node[]

    @TreeParent()
    parent: Node
}
