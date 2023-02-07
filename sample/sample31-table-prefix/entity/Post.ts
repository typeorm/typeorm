import {
    Column,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
} from "../../../src/index"
import { JoinTable } from "../../../src/decorator/relations/JoinTable"
import { ManyToMany } from "../../../src/decorator/relations/ManyToMany"
import { Author } from "./Author"
import { Category } from "./Category"

@Entity("sample31_post")
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string

    @Column()
    text: string

    @ManyToOne((type) => Author, {
        cascade: ["insert"],
    })
    author: Author

    @ManyToMany((type) => Category, {
        cascade: ["insert"],
    })
    @JoinTable()
    categories: Category[]
}
