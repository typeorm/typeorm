import { Entity } from "typeorm/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { Post } from "./Post"
import { OneToMany } from "typeorm/decorator/relations/OneToMany"
import { DeleteDateColumn } from "typeorm"

@Entity()
export class Category {
    @PrimaryGeneratedColumn()
    id: number

    @OneToMany(() => Post, (post) => post.category, {
        cascade: true,
        eager: true,
    })
    posts: Post[]

    @DeleteDateColumn()
    deletedAt?: Date
}
