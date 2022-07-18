import { PrimaryColumn } from "typeorm/decorator/columns/PrimaryColumn"
import { Entity } from "typeorm/decorator/entity/Entity"
import { Column } from "typeorm/decorator/columns/Column"
import { ManyToMany } from "typeorm/decorator/relations/ManyToMany"
import { JoinTable } from "typeorm/decorator/relations/JoinTable"
import { RelationCount } from "typeorm/decorator/relations/RelationCount"
import { Category } from "./Category"

@Entity()
export class Post {
    @PrimaryColumn()
    id: number

    @Column()
    title: string

    @Column()
    isRemoved: boolean = false

    @ManyToMany((type) => Category, (category) => category.posts)
    @JoinTable()
    categories: Category[]

    @RelationCount((post: Post) => post.categories)
    categoryCount: number

    @RelationCount((post: Post) => post.categories, "removedCategories", (qb) =>
        qb.andWhere("removedCategories.isRemoved = :isRemoved", {
            isRemoved: true,
        }),
    )
    removedCategoryCount: number
}
