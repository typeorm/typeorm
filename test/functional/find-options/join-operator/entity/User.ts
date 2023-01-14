import {
    Column,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn,
} from "../../../../../src"
import { Post } from "./Post"

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @OneToMany(() => Post, (post) => post.owner)
    posts: Post[]
}
