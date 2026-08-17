import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    ManyToMany,
    JoinTable,
    JoinColumn,
} from "../../../../src"
import { User } from "./User"
import { Tag } from "./Tag"
import { Category } from "./Category"

@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string

    @ManyToOne(() => User, (user) => user.posts)
    @JoinColumn()
    author: User

    @ManyToOne(() => Tag)
    tag: Tag

    @ManyToMany(() => Category)
    @JoinTable()
    categories: Category[]
}
