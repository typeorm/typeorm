import { Column, Entity, PrimaryGeneratedColumn } from "../../../src/index"
import { Author } from "./Author"
import { ManyToOne } from "../../../src/decorator/relations/ManyToOne"
import { Category } from "./Category"
import { ManyToMany } from "../../../src/decorator/relations/ManyToMany"
import { JoinTable } from "../../../src/decorator/relations/JoinTable"
import { JoinColumn } from "../../../src/decorator/relations/JoinColumn"

@Entity("sample21_post")
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string

    @Column()
    text: string

    @ManyToOne(() => Author, (author) => author.posts, {
        cascade: true,
    })
    @JoinColumn({
        // todo: not yet fixed
        name: "user",
    })
    author: Author

    @ManyToMany(() => Category, (category) => category.posts, {
        cascade: true,
    })
    @JoinTable({
        name: "_post_categories",
    })
    categories: Category[]
}
