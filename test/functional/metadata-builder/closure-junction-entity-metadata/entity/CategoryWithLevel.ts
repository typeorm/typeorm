import { Column } from "../../../../../src/decorator/columns/Column"
import { PrimaryGeneratedColumn } from "../../../../../src/decorator/columns/PrimaryGeneratedColumn"
import { Entity } from "../../../../../src/decorator/entity/Entity"
import { Tree } from "../../../../../src/decorator/tree/Tree"
import { TreeChildren } from "../../../../../src/decorator/tree/TreeChildren"
import { TreeLevelColumn } from "../../../../../src/decorator/tree/TreeLevelColumn"
import { TreeParent } from "../../../../../src/decorator/tree/TreeParent"
import { ICategory } from "./Category.interface"

@Entity()
@Tree("closure-table")
export class CategoryWithLevel implements ICategory {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @TreeParent()
    parent: CategoryWithLevel | null

    @TreeChildren()
    children: CategoryWithLevel[]

    @TreeLevelColumn()
    level: number
}
