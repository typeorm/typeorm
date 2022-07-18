import { PrimaryGeneratedColumn } from "typeorm"
import { Column } from "typeorm"
import { TreeParent } from "typeorm"
import { TreeChildren } from "typeorm"
import { Entity } from "typeorm"
import { Tree } from "typeorm"

@Entity()
@Tree("closure-table")
export class Category {
    @PrimaryGeneratedColumn("uuid")
    id: number

    @Column()
    name: string

    @TreeParent()
    parentCategory: Category

    @TreeChildren({ cascade: true })
    childCategories: Category[]
}
