import {
    Column,
    Entity,
    JoinColumn,
    PrimaryColumn,
    Tree,
    TreeChildren,
    TreeParent,
} from "../../../../../../src"

@Entity({ name: "foo2" })
@Tree("closure-table", {
    closureTableName: "foo2",
    ancestorColumnName: () => "ancestor_id",
    descendantColumnName: () => "descendant_id",
})
export class Foo2Entity {
    @PrimaryColumn({
        type: "decimal",
        name: "id",
        precision: 9,
        scale: 3,
    })
    id: number

    @Column({
        type: "decimal",
        name: "parent_id",
        precision: 9,
        scale: 3,
    })
    parentId: number

    @TreeParent()
    @JoinColumn({ name: "parent_id" })
    parent: Foo2Entity

    @TreeChildren()
    children: Foo2Entity[]
}
