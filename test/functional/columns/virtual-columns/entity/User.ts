import {
    Column,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn,
    VirtualColumn,
} from "../../../../../src"
import type { Post } from "./Post"

@Entity({ name: "users" })
export class User {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    firstName: string

    @Column()
    lastName: string

    @VirtualColumn({
        query: (alias) =>
            `${alias}."firstName" || ' ' || ${alias}."lastName"`,
    })
    fullName?: string

    @OneToMany("Post", (post: Post) => post.author)
    posts: Post[]
}
