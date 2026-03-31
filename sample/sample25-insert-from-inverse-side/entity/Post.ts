import { Column, Entity, PrimaryGeneratedColumn } from "../../../src/index"
import { Author } from "./Author"
import { ManyToOne } from "../../../src/decorator/relations/ManyToOne"

@Entity("sample25_post")
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string

    @Column()
    text: string

    @ManyToOne(() => Author, (author) => author.posts)
    author: Author
}
