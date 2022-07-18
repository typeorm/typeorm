import { ManyToMany } from "../../typeorm/decorator/relations/ManyToMany"
import { Entity } from "../../typeorm/decorator/entity/Entity"
import { Column } from "../../typeorm/decorator/columns/Column"
import { JoinTable } from "../../typeorm/decorator/relations/JoinTable"
import { PrimaryColumn } from "../../typeorm/decorator/columns/PrimaryColumn"
import { Category } from "./Category"

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

    @ManyToMany((type) => Category, (category) => category.posts)
    @JoinTable()
    categories: Category[]

    @ManyToMany((type) => Category)
    @JoinTable()
    subcategories: Category[]

    categoryIds: number[]
}
