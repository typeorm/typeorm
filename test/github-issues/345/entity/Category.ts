import { Entity } from "typeorm/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "typeorm/decorator/columns/Column"
import { Post } from "./Post"
import { ManyToMany } from "typeorm/decorator/relations/ManyToMany"
import { JoinTable } from "typeorm/decorator/relations/JoinTable"

@Entity()
export class Category {
    @PrimaryGeneratedColumn()
    category_id: number

    @Column()
    name: string

    @ManyToMany(() => Post, (post) => post.categories)
    @JoinTable()
    posts: Post[]
}
