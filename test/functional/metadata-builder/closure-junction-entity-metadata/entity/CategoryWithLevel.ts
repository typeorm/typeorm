import { PrimaryGeneratedColumn } from "../../../../../src/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "../../../../../src/decorator/columns/Column"
import { TreeParent } from "../../../../../src/decorator/tree/TreeParent"
import { TreeChildren } from "../../../../../src/decorator/tree/TreeChildren"
import { Entity } from "../../../../../src/decorator/entity/Entity"
import { Tree } from "../../../../../src/decorator/tree/Tree"
import { TreeLevelColumn } from "../../../../../src/decorator/tree/TreeLevelColumn"

@Entity()
@Tree("closure-table")
export class CategoryWithLevel {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @TreeParent()
    parent: CategoryWithLevel

    @TreeChildren()
    children: CategoryWithLevel[]

    @TreeLevelColumn()
    level: number
}
