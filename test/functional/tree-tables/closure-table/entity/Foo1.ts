import {
    Column,
    Entity,
    JoinColumn,
    PrimaryGeneratedColumn,
    Tree,
    TreeChildren,
    TreeParent,
} from "../../../../../src"

@Entity({ name: "foo1" })
@Tree("closure-table", {
    closureTableName: "foo1",
    ancestorColumnName: () => "ancestor_id",
    descendantColumnName: () => "descendant_id",
})
export class Foo1Entity {
    @PrimaryGeneratedColumn({ type: "int", name: "id", unsigned: true })
    id: number

    @Column({ type: "int", name: "parent_id", unsigned: true })
    parentId: number

    @TreeParent()
    @JoinColumn({ name: "parent_id", referencedColumnName: "id" })
    parent: Foo1Entity

    @TreeChildren()
    children: Foo1Entity[]
}
