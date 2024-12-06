import { Entity, ManyToOne, PrimaryGeneratedColumn } from "../../../../../../src"
import { Comment } from "./Comment"

@Entity()
export class CommentLike {
    @PrimaryGeneratedColumn()
    id: number

    @ManyToOne(() => Comment, {
        filterConditionCascade: true,
    })
    comment: Comment
}
