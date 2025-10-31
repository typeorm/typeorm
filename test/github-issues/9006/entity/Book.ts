import {
    Column,
    Entity,
    ManyToMany,
    OneToMany,
    PrimaryGeneratedColumn,
} from "../../../../src"
import { Author } from "./Author"
import { Comment } from "./Comment"

@Entity()
export class Book {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string

    @Column()
    text: string

    @ManyToMany(() => Author)
    author?: Author[]

    @OneToMany(() => Comment, (comment) => comment.book, { eager: true })
    comments?: Comment[]
}
