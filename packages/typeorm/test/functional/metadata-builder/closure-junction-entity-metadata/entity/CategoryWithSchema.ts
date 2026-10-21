import { Column } from "../../../../../src/decorator/columns/Column"
import { PrimaryGeneratedColumn } from "../../../../../src/decorator/columns/PrimaryGeneratedColumn"
import { Entity } from "../../../../../src/decorator/entity/Entity"
import { Tree } from "../../../../../src/decorator/tree/Tree"
import { TreeChildren } from "../../../../../src/decorator/tree/TreeChildren"
import { TreeParent } from "../../../../../src/decorator/tree/TreeParent"
import { ICategory } from "./Category.interface"

export const schemaName = "my_entity_schema"

@Entity({ schema: schemaName })
@Tree("closure-table")
export class CategoryWithSchema implements ICategory {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @TreeParent()
    parent: CategoryWithSchema

    @TreeChildren()
    children: CategoryWithSchema[]
}
