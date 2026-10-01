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

    // v2: With cascade: true
    @ManyToOne(() => User, { cascade: true })
    @JoinColumn()
    author: User
}
