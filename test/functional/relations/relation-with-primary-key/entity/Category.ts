import { Entity } from "typeorm/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "typeorm/decorator/columns/Column"
import { Post } from "./Post"
import { OneToMany } from "typeorm/decorator/relations/OneToMany"

@Entity()
export class Category {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @OneToMany((type) => Post, (post) => post.category, {
        cascade: ["insert"],
    })
    posts: Post[]
}
