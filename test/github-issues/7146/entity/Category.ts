import {
    Entity,
    JoinColumn,
    OneToOne,
    PrimaryGeneratedColumn,
} from "../../../../src"
import { Post } from "./Post"

@Entity()
export class Category {
    @PrimaryGeneratedColumn()
    id: number

    @OneToOne(() => Post, (post) => post.lazyOneToOne, {
        nullable: true,
        eager: false,
    })
    @JoinColumn()
    backRef1: Post

    @OneToOne(() => Post, (post) => post.eagerOneToOne, {
        nullable: true,
        eager: false,
    })
    @JoinColumn()
    backRef2: Post
}
