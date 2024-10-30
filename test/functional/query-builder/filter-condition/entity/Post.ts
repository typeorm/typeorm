import {
    Column,
    Entity,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
} from "../../../../../src"
import { Comment } from "./Comment"
import { User } from "./User"

@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string

    @ManyToOne(() => User, {
        filterConditionCascade: true,
    })
    author: User

    @OneToMany(() => Comment, (comment) => comment.post)
    comments: Comment[]
}
