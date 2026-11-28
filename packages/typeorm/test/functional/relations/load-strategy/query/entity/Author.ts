import {
    Column,
    Entity,
    JoinTable,
    ManyToMany,
    OneToMany,
    OneToOne,
    PrimaryGeneratedColumn,
} from "../../../../../../src"
import { Book } from "./Book"
import { Comment } from "./Comment"
import { Profile } from "./Profile"

@Entity()
export class Author {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @JoinTable({
        name: "AuthorBooks",
    })
    @ManyToMany(() => Book, (book) => book.author, { eager: true })
    books: Book[]

    @OneToMany(() => Comment, (comment) => comment.author)
    comments: Comment[]

    @OneToOne(() => Profile, (profile) => profile.author)
    profile?: Profile | null
}
