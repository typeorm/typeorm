import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from "../../../../../../../src/index"
import { User } from "./User"

@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string

    // v1: No cascade option
    @ManyToOne(() => User)
    @JoinColumn()
    author: User
}
