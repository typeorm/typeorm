import { PrimaryGeneratedColumn } from "../../../../../src/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "../../../../../src/decorator/columns/Column"
import { TreeParent } from "../../../../../src/decorator/tree/TreeParent"
import { TreeChildren } from "../../../../../src/decorator/tree/TreeChildren"
import { Entity } from "../../../../../src/decorator/entity/Entity"
import { Tree } from "../../../../../src/decorator/tree/Tree"

@Entity({ name: "space_with_schema", schema: "my_schema" })
@Tree("closure-table")
export class SpaceWithSchema {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @TreeParent()
    parent: SpaceWithSchema

    @TreeChildren()
    children: SpaceWithSchema[]
}
