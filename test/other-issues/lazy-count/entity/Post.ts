import {
    Column,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn,
} from "../../../../src"
import { Comment } from "./Comment"

@Entity()
export class Post {
    @PrimaryGeneratedColumn("increment")
    id!: number

    @Column()
    content!: string

    @OneToMany(() => Comment, (comment) => comment.post, {
        cascade: ["insert"],
    })
    comments: Comment[]
}
