import { PrimaryColumn } from "typeorm/decorator/columns/PrimaryColumn"
import { Entity } from "typeorm/decorator/entity/Entity"
import { Column } from "typeorm/decorator/columns/Column"
import { OneToMany } from "typeorm/decorator/relations/OneToMany"
import { RelationCount } from "typeorm/decorator/relations/RelationCount"
import { Category } from "./Category"

@Entity()
export class Post {
    @PrimaryColumn()
    id: number

    @Column()
    title: string

    @OneToMany((type) => Category, (category) => category.post)
    categories: Category[]

    @RelationCount((post: Post) => post.categories)
    categoryCount: number

    @RelationCount((post: Post) => post.categories, "rc", (qb) =>
        qb.andWhere("rc.isRemoved = :isRemoved", { isRemoved: true }),
    )
    removedCategoryCount: number
}
