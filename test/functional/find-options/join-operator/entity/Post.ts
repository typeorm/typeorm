import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from "../../../../../src"
import { User } from "./User"
import { Category } from "./Category"

@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string

    @ManyToOne(() => User, (user) => user.posts)
    @JoinColumn()
    owner: User

    @ManyToOne(() => Category)
    @JoinColumn()
    category: Category
}
