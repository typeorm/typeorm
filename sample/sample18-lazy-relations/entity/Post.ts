import { Column, Entity, PrimaryGeneratedColumn } from "../../../src/index"
import { Author } from "./Author"
import { ManyToOne } from "../../../src/decorator/relations/ManyToOne"
import { Category } from "./Category"
import { ManyToMany } from "../../../src/decorator/relations/ManyToMany"
import { JoinTable } from "../../../src/decorator/relations/JoinTable"

@Entity("sample18_post")
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string

    @Column()
    text: string

    @ManyToOne(() => Author, (author) => author.posts, {
        cascade: ["insert"],
        onDelete: "SET NULL",
    })
    author: Promise<Author | null>

    @ManyToMany(() => Category, (category) => category.posts, {
        cascade: true,
    })
    @JoinTable()
    categories: Promise<Category[]>
}
