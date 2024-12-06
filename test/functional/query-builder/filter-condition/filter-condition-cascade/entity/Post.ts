import {
    Column,
    DeleteDateColumn,
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
        filterConditionCascade: true, // TODO: Fix: This is singhandedly quadrupling the joins
        // eager: true
    })
    author: User

    @Column({
        default: false,
        rawFilterCondition: (column) => `${column} = FALSE`,
    })
    draft: boolean

    @DeleteDateColumn({ type: "timestamp with time zone" })
    deletedAt?: Date

    @OneToMany(() => Comment, (comment) => comment.post)
    comments: Comment[]

    @ManyToMany(() => Category, (category) => category.posts)
    categories: Category[]
}
