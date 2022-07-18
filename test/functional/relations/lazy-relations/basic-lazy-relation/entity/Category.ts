import { Entity } from "typeorm/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "typeorm/decorator/columns/Column"
import { ManyToMany } from "typeorm/decorator/relations/ManyToMany"
import { OneToMany } from "typeorm/decorator/relations/OneToMany"
import { OneToOne } from "typeorm/decorator/relations/OneToOne"
import { Post } from "./Post"

@Entity()
export class Category {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @OneToOne((type) => Post, (post) => post.oneCategory)
    onePost: Promise<Post>

    @ManyToMany((type) => Post, (post) => post.twoSideCategories)
    twoSidePosts: Promise<Post[]>

    @OneToMany((type) => Post, (post) => post.twoSideCategory)
    twoSidePosts2: Promise<Post[]>
}
