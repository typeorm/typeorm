import { Column } from "../../../../../../src/decorator/columns/Column"
import { PrimaryGeneratedColumn } from "../../../../../../src/decorator/columns/PrimaryGeneratedColumn"
import { Entity } from "../../../../../../src/decorator/entity/Entity"
import { Tree } from "../../../../../../src/decorator/tree/Tree"
import { TreeChildren } from "../../../../../../src/decorator/tree/TreeChildren"
import { TreeParent } from "../../../../../../src/decorator/tree/TreeParent"
import { ICategory } from "./Category.interface"

@Entity()
@Tree("closure-table", {
    closureTableSchema: "my_closure_schema",
})
export class CategoryWithSchemaInClosure implements ICategory {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @TreeParent()
    parentCategory: CategoryWithSchemaInClosure | null

    @TreeChildren()
    childCategories: CategoryWithSchemaInClosure[]
}
