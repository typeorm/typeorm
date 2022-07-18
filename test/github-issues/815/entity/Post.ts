import { Entity } from "typeorm/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "typeorm/decorator/columns/Column"
import { OneToMany } from "typeorm/decorator/relations/OneToMany"
import { Category } from "./Category"
import { RelationId } from "typeorm/decorator/relations/RelationId"
import { ManyToMany } from "typeorm/decorator/relations/ManyToMany"
import { JoinTable } from "typeorm/decorator/relations/JoinTable"

@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string

    @OneToMany((type) => Category, (category) => category.post)
    categories: Category[]

    @RelationId((post: Post) => post.categories)
    categoryIds: { firstId: number; secondId: number }[]

    @ManyToMany((type) => Category, (category) => category.manyPosts)
    @JoinTable()
    manyCategories: Category[]

    @RelationId((post: Post) => post.manyCategories)
    manyCategoryIds: { firstId: number; secondId: number }[]
}
