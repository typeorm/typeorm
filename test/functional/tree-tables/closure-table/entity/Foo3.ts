import {
    Column,
    Entity,
    JoinColumn,
    PrimaryColumn,
    Tree,
    TreeChildren,
    TreeParent,
} from "../../../../../src"

@Entity({ name: "foo3" })
@Tree("closure-table", {
    closureTableName: "foo3",
    ancestorColumnName: () => "ancestor_id",
    descendantColumnName: () => "descendant_id",
})
export class Foo3Entity {
    @PrimaryColumn({
        type: "varchar",
        name: "id",
        length: 201,
        charset: "latin1",
        collation: "latin1_bin",
    })
    id: string

    @Column({
        type: "varchar",
        name: "parent_id",
        length: 201,
        charset: "latin1",
        collation: "latin1_bin",
    })
    parentId: string

    @TreeParent()
    @JoinColumn({ name: "parent_id", referencedColumnName: "id" })
    parent: Foo3Entity

    @TreeChildren()
    children: Foo3Entity[]
}
