import { Entity } from "typeorm/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "typeorm/decorator/columns/Column"
import { ManyToOne } from "typeorm/decorator/relations/ManyToOne"
import { JoinColumn } from "typeorm/decorator/relations/JoinColumn"
import { OneToMany } from "typeorm/decorator/relations/OneToMany"
import { Category } from "./Category"
import { PostCategory } from "./PostCategory"

@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string

    @ManyToOne((type) => Category)
    @JoinColumn({ referencedColumnName: "name" })
    categoryByName: Category

    @ManyToOne((type) => Category)
    @JoinColumn()
    category: Category

    @OneToMany(
        (type) => PostCategory,
        (postCategoryRelation) => postCategoryRelation.post,
    )
    categories: PostCategory[]

    categoryId: number

    categoryName: string
}
