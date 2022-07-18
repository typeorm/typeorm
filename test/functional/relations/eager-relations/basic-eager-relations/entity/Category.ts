import { Entity } from "../typeorm/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "../typeorm/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "../typeorm/decorator/columns/Column"
import { ManyToMany } from "../typeorm/decorator/relations/ManyToMany"
import { JoinTable } from "../typeorm/decorator/relations/JoinTable"
import { Post } from "./Post"

@Entity()
export class Category {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @ManyToMany((type) => Post, (post) => post.categories2)
    @JoinTable()
    posts2: Post[]
}
