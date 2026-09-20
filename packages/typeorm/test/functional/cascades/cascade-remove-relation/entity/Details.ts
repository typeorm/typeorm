import {
    Column,
    Entity,
    OneToOne,
    PrimaryGeneratedColumn,
} from "../../../../../src"
import type { Post } from "./Post"

@Entity()
export class Details {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    comment: string

    @OneToOne("Post", "details")
    post: Post
}
