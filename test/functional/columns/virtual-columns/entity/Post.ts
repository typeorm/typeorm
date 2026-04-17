import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "../../../../../src"
import { User } from "./User"

@Entity({ name: "user_posts" })
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string

    @ManyToOne(() => User, (user) => user.posts, { nullable: true })
    author: User
}
