import { Entity, PrimaryGeneratedColumn } from "typeorm"
import { Tree } from "typeorm/decorator/tree/Tree"
import { TreeParent } from "typeorm/decorator/tree/TreeParent"
import { TreeChildren } from "typeorm/decorator/tree/TreeChildren"
import { Column } from "typeorm/decorator/columns/Column"

@Entity()
@Tree("closure-table")
export class Category {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @TreeParent()
    parentCategory: Category

    @TreeChildren({ cascade: true })
    childCategories: Category[]
}
