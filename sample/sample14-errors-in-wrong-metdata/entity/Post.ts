import {
    Column,
    Entity,
    OneToOne,
    PrimaryGeneratedColumn,
} from "../../../src/index"
import { PostAuthor } from "./PostAuthor"
import { JoinColumn } from "../../../src/decorator/relations/JoinColumn"
import { OneToMany } from "../../../src/decorator/relations/OneToMany"
import { JoinTable } from "../../../src/decorator/relations/JoinTable"
import { ManyToMany } from "../../../src/decorator/relations/ManyToMany"

@Entity("sample14_post")
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string

    @Column()
    text: string

    @OneToOne((type) => PostAuthor, (author) => author.post, {
        cascade: true,
    })
    @JoinColumn() // comment this and you'll get an error because JoinColumn must be at least on one side of the one-to-one relationship
    // @JoinTable() // uncomment this and you'll get an error because JoinTable is not allowed here (only many-to-many)
    author: PostAuthor

    @OneToMany((type) => PostAuthor, (author) => author.editedPost, {
        cascade: true,
    })
    // @JoinColumn() // uncomment this and you'll get an error, because JoinColumn is not allowed here (only many-to-one/one-to-one)
    // @JoinTable() // uncomment this and you'll get an error because JoinTable is not allowed here (only many-to-many)
    editors: PostAuthor[]

    @ManyToMany((type) => PostAuthor, (author) => author.manyPosts)
    @JoinTable() // comment this and you'll get an error because JoinTable must be at least on one side of the many-to-many relationship
    manyAuthors: PostAuthor[]
}
