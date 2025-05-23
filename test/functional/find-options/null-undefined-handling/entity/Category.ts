import {
    Column,
    Entity,
    PrimaryGeneratedColumn,
    OneToMany,
} from "../../../../../src"
import { Post } from "./Post"

@Entity()
export class Category {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @Column({ nullable: true, type: "varchar" })
    slug: string | null

    @OneToMany(() => Post, (post) => post.category)
    posts: Post[]
}
