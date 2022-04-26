import { Column, Entity, PrimaryGeneratedColumn } from "../../../src/index"
import { ManyToMany } from "../../../src/decorator/relations/ManyToMany"
import { Category } from "./Category"
import { JoinTable } from "../../../src/decorator/relations/JoinTable"

@Entity("sample30_post", {
    orderBy: {
        title: "ASC",
        id: "DESC",
    },
})
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string

    @Column()
    text: string

    @ManyToMany((type) => Category)
    @JoinTable()
    categories: Category[]

    constructor(title: string, text: string, categories: Category[]) {
        this.title = title
        this.text = text
        this.categories = categories
    }
}
