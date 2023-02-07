import { Entity, ManyToMany, PrimaryColumn } from "../../../../src"
import { JoinTable } from "../../../../src/decorator/relations/JoinTable"
import { Category } from "./Category"

@Entity()
export class Post {
    @PrimaryColumn({ collation: "utf8_unicode_ci", charset: "utf8" })
    id: string

    @ManyToMany((type) => Category, (category) => category.posts)
    @JoinTable()
    categories: Category[]
}
