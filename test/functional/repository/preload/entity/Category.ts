import { Column } from "../../../../../src/decorator/columns/Column"
import { Entity } from "../../../../../src/decorator/entity/Entity"
import { JoinColumn } from "../../../../../src/decorator/relations/JoinColumn"
import { ManyToOne } from "../../../../../src/decorator/relations/ManyToOne"
import { PrimaryGeneratedColumn } from "../../../../../src/decorator/columns/PrimaryGeneratedColumn"
import { Author } from "./Author"
import { Post } from "./Post"

@Entity()
export class Category {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @ManyToOne(() => Post, (post) => post.categories)
    post: Post

    @ManyToOne(() => Author, { eager: true })
    @JoinColumn()
    author: Author
}
