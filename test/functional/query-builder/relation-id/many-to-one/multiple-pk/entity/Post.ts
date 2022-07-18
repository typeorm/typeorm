import { Entity } from "../../typeorm/decorator/entity/Entity"
import { Column } from "../../typeorm/decorator/columns/Column"
import { PrimaryColumn } from "../../typeorm/decorator/columns/PrimaryColumn"
import { Category } from "./Category"
import { ManyToOne } from "../../typeorm/decorator/relations/ManyToOne"

@Entity()
export class Post {
    @PrimaryColumn()
    id: number

    @PrimaryColumn()
    authorId: number

    @Column()
    title: string

    @Column()
    isRemoved: boolean = false

    @ManyToOne((type) => Category, (category) => category.posts)
    category: Category

    @ManyToOne((type) => Category)
    subcategory: Category

    categoryId: number
}
