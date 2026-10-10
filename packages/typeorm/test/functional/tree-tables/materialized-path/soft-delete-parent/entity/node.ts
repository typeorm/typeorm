import {
    TreeChildren,
    TreeParent,
    Entity,
    PrimaryGeneratedColumn,
    DeleteDateColumn,
    Column,
    Tree,
    JoinColumn,
} from "../../../../../../src"

@Entity()
@Tree("materialized-path")
export class Node {
    @PrimaryGeneratedColumn()
    id: number

    @DeleteDateColumn()
    deletedAt: Date

    @Column()
    name: string

    @TreeChildren({ cascade: true })
    children: Node[]

    @Column({ nullable: true })
    parentId: number

    @TreeParent()
    @JoinColumn({ name: "parentId" })
    parent: Node
}
