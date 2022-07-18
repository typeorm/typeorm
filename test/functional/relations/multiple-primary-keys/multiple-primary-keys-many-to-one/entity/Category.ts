import { Entity } from "typeorm/decorator/entity/Entity"
import { PrimaryColumn } from "typeorm/decorator/columns/PrimaryColumn"
import { Column } from "typeorm/decorator/columns/Column"
import { OneToMany } from "typeorm/decorator/relations/OneToMany"
import { Post } from "./Post"
import { Unique } from "typeorm"

@Entity()
@Unique(["code", "version", "description"])
export class Category {
    @PrimaryColumn()
    name: string

    @PrimaryColumn()
    type: string

    @Column()
    code: number

    @Column()
    version: number

    @Column({ nullable: true })
    description: string

    @OneToMany((type) => Post, (post) => post.category)
    posts: Post[]

    @OneToMany((type) => Post, (post) => post.categoryWithJoinColumn)
    postsWithJoinColumn: Post[]

    @OneToMany((type) => Post, (post) => post.categoryWithOptions)
    postsWithOptions: Post[]

    @OneToMany((type) => Post, (post) => post.categoryWithNonPKColumns)
    postsWithNonPKColumns: Post[]
}
