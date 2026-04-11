import { Entity, ManyToMany, PrimaryColumn } from "../../../../src"
import { JoinTable } from "../../../../src/decorator/relations/JoinTable"
import { Category } from "./Category"

@Entity()
export class Post {
    @PrimaryColumn({ charset: "latin2", collation: "latin2_general_ci" })
    id: string

    @ManyToMany(() => Category, (category) => category.posts)
    @JoinTable()
    categories: Category[]
}
