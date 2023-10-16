import {Entity,ManyToOne, PrimaryGeneratedColumn} from "../../../../src"
import { User } from "./user"

@Entity()
export class Post {
    @PrimaryGeneratedColumn("increment")
    id!: number

    @ManyToOne(() => User, (user: User) => user.posts, {
        cascade: true,
        eager: true,
    })
    author!: User;
}
