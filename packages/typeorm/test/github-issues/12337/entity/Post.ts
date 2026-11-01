import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
} from "../../../../src"
import { Author } from "./Author"

@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string

    @Column({ nullable: true })
    authorId: number

    @ManyToOne(() => Author, (author) => author.posts)
    @JoinColumn({ name: "authorId" })
    author: Author
}
