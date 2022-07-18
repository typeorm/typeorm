import { Entity } from "../typeorm/decorator/entity/Entity"
import { Column } from "../typeorm/decorator/columns/Column"
import { PrimaryGeneratedColumn } from "../typeorm/decorator/columns/PrimaryGeneratedColumn"
import { ManyToMany } from "../typeorm/decorator/relations/ManyToMany"
import { JoinTable } from "../typeorm/decorator/relations/JoinTable"
import { Category } from "./Category"

@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string

    @ManyToMany((type) => Category, (category) => category.posts)
    @JoinTable()
    categories: Category[]

    @ManyToMany((type) => Category, (category) => category.postsWithOptions)
    @JoinTable({
        name: "post_categories",
        joinColumns: [
            {
                name: "postId",
                referencedColumnName: "id",
            },
        ],
        inverseJoinColumns: [
            {
                name: "categoryName",
                referencedColumnName: "name",
            },
            {
                name: "categoryType",
                referencedColumnName: "type",
            },
        ],
    })
    categoriesWithOptions: Category[]

    @ManyToMany(
        (type) => Category,
        (category) => category.postsWithNonPKColumns,
    )
    @JoinTable({
        name: "post_categories_non_primary",
        joinColumns: [
            {
                name: "postId",
                referencedColumnName: "id",
            },
        ],
        inverseJoinColumns: [
            {
                name: "categoryCode",
                referencedColumnName: "code",
            },
            {
                name: "categoryVersion",
                referencedColumnName: "version",
            },
            {
                name: "categoryDescription",
                referencedColumnName: "description",
            },
        ],
    })
    categoriesWithNonPKColumns: Category[]
}
