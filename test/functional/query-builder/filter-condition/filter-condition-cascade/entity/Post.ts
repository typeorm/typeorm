import {
    Column,
    Entity,
    ManyToMany,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
} from "../../../../../../src"
import { Category } from "./Category"
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

    @ManyToMany(() => Category, (category) => category.posts)
    categories: Category[]
}
