import { Entity } from "typeorm/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { Post } from "./Post"
import { OneToMany } from "typeorm/decorator/relations/OneToMany"

@Entity()
export class Category {
    @PrimaryGeneratedColumn()
    id: number

    @OneToMany(() => Post, (post) => post.category, {
        cascade: ["insert"],
        eager: true,
    })
    posts: Post[]
}
