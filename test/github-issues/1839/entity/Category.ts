import { Entity, PrimaryColumn } from "../../../../src"
import { ManyToMany } from "../../../../src/decorator/relations/ManyToMany"
import { Post } from "./Post"

@Entity()
export class Category {
    @PrimaryColumn({ charset: "ascii", collation: "ascii_general_ci" })
    id: string

    @ManyToMany(() => Post, (post) => post.categories)
    posts: Post[]
}
