import { Column } from "../../../../../../../src/decorator/columns/Column"
import { ChildEntity } from "../../../../../../../src/decorator/entity/ChildEntity"
import { OneToMany } from "../../../../../../../src/decorator/relations/OneToMany"
import { Actor } from "./Actor"
import { Post } from "./Post"

@ChildEntity()
export class User extends Actor {
    @Column()
    email: string

    @OneToMany(() => Post, (post) => post.author)
    posts: Post[]
}
