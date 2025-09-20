import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
} from "../../../../src"
import { User } from "./User"

@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string

    @ManyToOne(() => User, (user) => user.posts)
    user: User
}
