import {
    TreeChildren,
    TreeParent,
    Entity,
    PrimaryGeneratedColumn,
    DeleteDateColumn,
    Column,
    Tree,
    JoinColumn,
} from "../../../../src"

@Entity("node")
@Tree("materialized-path")
export class Node {
    @PrimaryGeneratedColumn({ type: "int" })
    id?: number

    @DeleteDateColumn()
    deletedAt?: Date

    @Column("varchar")
    name!: string

    @TreeChildren({ cascade: true })
    children?: Node[]

    @Column({ type: "int", nullable: true, name: "parentId" })
    parentId?: number

    @TreeParent()
    @JoinColumn({
        name: "parentId",
        referencedColumnName: "id",
    })
    parent?: Node
}
