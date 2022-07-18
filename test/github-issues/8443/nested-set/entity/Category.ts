import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "typeorm/decorator/columns/Column"
import { TreeParent } from "typeorm/decorator/tree/TreeParent"
import { TreeChildren } from "typeorm/decorator/tree/TreeChildren"
import { Entity } from "typeorm/decorator/entity/Entity"
import { Tree } from "typeorm/decorator/tree/Tree"
import { JoinColumn } from "typeorm"

@Entity()
@Tree("nested-set")
export class Category {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @TreeParent()
    @JoinColumn({
        name: "parent_category_id",
    })
    parentCategory: Category

    @TreeChildren({ cascade: true })
    childCategories: Category[]

    // @TreeLevelColumn()
    // level: number;
}
