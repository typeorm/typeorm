import { Entity } from "../typeorm/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "../typeorm/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "../typeorm/decorator/columns/Column"
import { ManyToMany } from "../typeorm/decorator/relations/ManyToMany"
import { JoinTable } from "../typeorm/decorator/relations/JoinTable"
import { Category } from "./Category"
import { User } from "./User"
import { ManyToOne } from "../typeorm/decorator/relations/ManyToOne"
import { OneToMany } from "../typeorm/decorator/relations/OneToMany"
import { Editor } from "./Editor"

@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string

    @ManyToMany((type) => Category, { eager: true })
    @JoinTable()
    categories1: Category[]

    @ManyToMany((type) => Category, (category) => category.posts2, {
        eager: true,
    })
    categories2: Category[]

    @ManyToOne((type) => User, { eager: true })
    author: User

    @OneToMany((type) => Editor, (editor) => editor.post, { eager: true })
    editors: Editor[]
}
