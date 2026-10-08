import { Column, Entity, OneToMany, PrimaryColumn } from "../../../../../../src"
import { Post } from "./Post"

@Entity("user")
export class User {
    @PrimaryColumn()
    id: string

    @Column()
    name: string

    @OneToMany(() => Post, (post) => post.user)
    posts: Post[]
}
