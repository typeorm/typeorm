import { ManyToMany } from "../../typeorm/decorator/relations/ManyToMany"
import { Entity } from "../../typeorm/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "../../typeorm/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "../../typeorm/decorator/columns/Column"
import { ManyToOne } from "../../typeorm/decorator/relations/ManyToOne"
import { JoinTable } from "../../typeorm/decorator/relations/JoinTable"
import { Category } from "./Category"
import { Tag } from "./Tag"

@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string

    @ManyToOne((type) => Tag)
    tag: Tag

    tagId: number

    @ManyToMany((type) => Category, (category) => category.posts)
    @JoinTable()
    categories: Category[]

    @ManyToMany((type) => Category)
    @JoinTable()
    subcategories: Category[]

    categoryIds: number[]
}
