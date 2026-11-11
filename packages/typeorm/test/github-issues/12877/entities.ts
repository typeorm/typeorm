import {
    Column,
    Entity,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
} from "../../../src"

@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ type: "timestamptz" })
    createdAt: Date

    @OneToMany(() => Comment, (comment) => comment.post)
    comments: Comment[]
}

@Entity()
export class Comment {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ type: "timestamptz" })
    createdAt: Date

    @ManyToOne(() => Post, (post) => post.comments)
    post: Post
}
