import { PrimaryGeneratedColumn } from "../../../../../../src/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "../../../../../../src/decorator/columns/Column"
import { TreeParent } from "../../../../../../src/decorator/tree/TreeParent"
import { TreeChildren } from "../../../../../../src/decorator/tree/TreeChildren"
import { Entity } from "../../../../../../src/decorator/entity/Entity"
import { Tree } from "../../../../../../src/decorator/tree/Tree"

@Entity()
@Tree("closure-table", {
    closureTableSchema: "my_closure_schema",
})
export class CategoryWithSchemaInClosure {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @TreeParent()
    parentCategory: CategoryWithSchemaInClosure

    @TreeChildren()
    childCategories: CategoryWithSchemaInClosure[]
}
