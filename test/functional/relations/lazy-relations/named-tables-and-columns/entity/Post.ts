import { Entity } from "typeorm/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "typeorm/decorator/columns/Column"
import { ManyToMany } from "typeorm/decorator/relations/ManyToMany"
import { JoinTable } from "typeorm/decorator/relations/JoinTable"
import { ManyToOne } from "typeorm/decorator/relations/ManyToOne"
import { OneToOne } from "typeorm/decorator/relations/OneToOne"
import { JoinColumn } from "typeorm/decorator/relations/JoinColumn"
import { Category } from "./Category"

@Entity("s_post_named_all", {
    orderBy: {
        title: "ASC",
        id: "DESC",
    },
})
export class Post {
    @PrimaryGeneratedColumn({
        name: "s_post_id",
    })
    id: number

    @Column()
    title: string

    @Column()
    text: string

    @ManyToMany((type) => Category)
    @JoinTable()
    categories: Promise<Category[]>

    @ManyToMany((type) => Category, (category) => category.twoSidePosts)
    @JoinTable()
    twoSideCategories: Promise<Category[]>

    @Column()
    viewCount: number = 0

    @ManyToOne((type) => Category)
    category: Promise<Category>

    @OneToOne((type) => Category, (category) => category.onePost)
    @JoinColumn()
    oneCategory: Promise<Category>

    @ManyToOne((type) => Category, (category) => category.twoSidePosts2)
    twoSideCategory: Promise<Category>

    // ManyToMany with named properties
    @ManyToMany((type) => Category, (category) => category.postsNamedAll)
    @JoinTable()
    categoriesNamedAll: Promise<Category[]>

    // ManyToOne with named properties
    @ManyToOne((type) => Category, (category) => category.onePostsNamedAll)
    @JoinColumn({
        name: "s_category_named_all_id",
    })
    categoryNamedAll: Promise<Category>

    // OneToOne with named properties
    @OneToOne((type) => Category, (category) => category.onePostNamedAll)
    @JoinColumn({
        name: "s_one_category_named_all_id",
    })
    oneCategoryNamedAll: Promise<Category>
}
