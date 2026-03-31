import {
    Column,
    Entity,
    OneToOne,
    PrimaryGeneratedColumn,
} from "../../../../../src"
import type { Post } from "./Post"

@Entity()
export class Photo {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    url: string

    @OneToOne("Post", "photo")
    post: Post
}
