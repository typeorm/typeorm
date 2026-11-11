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

    // v3: With explicit onDelete: CASCADE
    @ManyToOne(() => User, { onDelete: "CASCADE" })
    @JoinColumn()
    author: User
}
