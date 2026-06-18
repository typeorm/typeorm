import { PrimaryGeneratedColumn } from "../../../../../src/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "../../../../../src/decorator/columns/Column"
import { TreeParent } from "../../../../../src/decorator/tree/TreeParent"
import { TreeChildren } from "../../../../../src/decorator/tree/TreeChildren"
import { Entity } from "../../../../../src/decorator/entity/Entity"
import { Tree } from "../../../../../src/decorator/tree/Tree"

export const schemaName = "my_closure_schema"

@Entity()
@Tree("closure-table", { closureTableSchema: schemaName })
export class CategoryWithSchemaInClosure {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @TreeParent()
    parent: CategoryWithSchemaInClosure

    @TreeChildren()
    children: CategoryWithSchemaInClosure[]
}
