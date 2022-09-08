import { Comment } from "./comment.entity"
import { Entity, OneToMany, PrimaryGeneratedColumn } from "../../../../src"

@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @OneToMany(() => Comment, (comment) => comment.post, {
        eager: true,
        cascade: true,
    })
    comments: Comment[]
}
