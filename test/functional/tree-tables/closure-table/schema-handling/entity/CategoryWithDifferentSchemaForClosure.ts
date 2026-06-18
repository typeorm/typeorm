import { PrimaryGeneratedColumn } from "../../../../../../src/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "../../../../../../src/decorator/columns/Column"
import { TreeParent } from "../../../../../../src/decorator/tree/TreeParent"
import { TreeChildren } from "../../../../../../src/decorator/tree/TreeChildren"
import { Entity } from "../../../../../../src/decorator/entity/Entity"
import { Tree } from "../../../../../../src/decorator/tree/Tree"

@Entity({ schema: "my_different_entity_schema" })
@Tree("closure-table", {
    closureTableSchema: "my_different_closure_schema",
})
export class CategoryWithDifferentSchemaForClosure {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @TreeParent()
    parentCategory: CategoryWithDifferentSchemaForClosure

    @TreeChildren()
    childCategories: CategoryWithDifferentSchemaForClosure[]
}
