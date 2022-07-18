import { Entity } from "typeorm/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "typeorm/decorator/columns/Column"
import { VersionColumn } from "typeorm/decorator/columns/VersionColumn"
import { Post } from "./Post"
import { OneToMany } from "typeorm"

@Entity()
export class Category {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @Column()
    description: string

    @VersionColumn()
    version: string

    @OneToMany(() => Post, (post) => post.category)
    posts: Post[]
}
