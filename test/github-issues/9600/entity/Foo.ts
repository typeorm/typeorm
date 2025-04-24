import {
    Column,
    Entity,
    JoinColumn,
    PrimaryGeneratedColumn,
    Tree,
    TreeChildren,
    TreeParent,
} from "../../../../src"

// won't work if bug exists

@Entity({ name: "foo" })
@Tree("closure-table", {
    closureTableName: "foo",
    ancestorColumnName: () => "ancestor_id",
    descendantColumnName: () => "descendant_id",
})
export class FooEntity {
    @PrimaryGeneratedColumn({ type: "int", name: "id", unsigned: true })
    id: number

    @Column("int", { name: "parent_id", unsigned: true })
    parentId: number

    @TreeParent()
    @JoinColumn({ name: "parent_id", referencedColumnName: "id" })
    parent: FooEntity

    @TreeChildren()
    children: FooEntity[]
}
