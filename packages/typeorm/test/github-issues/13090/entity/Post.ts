import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from "../../../../src"
import { Author } from "./Author"

@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ type: "int", nullable: true })
    authorId: number | null

    @ManyToOne(() => Author, { nullable: true })
    @JoinColumn({ name: "authorId" })
    author: Author | null
}
