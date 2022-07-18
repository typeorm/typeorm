import { Entity } from "typeorm/decorator/entity/Entity"
import { PrimaryColumn } from "typeorm/decorator/columns/PrimaryColumn"
import { Column } from "typeorm/decorator/columns/Column"
import { Post } from "./Post"
import { ManyToMany } from "typeorm/decorator/relations/ManyToMany"
import { Tag } from "./Tag"
import { Unique } from "typeorm"

@Entity()
@Unique(["code", "version", "description"])
export class Category {
    @PrimaryColumn(String, {
        length: 31,
    })
    name: string

    @PrimaryColumn(String, {
        length: 31,
    })
    type: string

    @Column()
    code: number

    @Column()
    version: number

    @Column({ nullable: true })
    description: string

    @ManyToMany((type) => Post, (post) => post.categories)
    posts: Post[]

    @ManyToMany((type) => Post, (post) => post.categoriesWithOptions)
    postsWithOptions: Post[]

    @ManyToMany((type) => Post, (post) => post.categoriesWithNonPKColumns)
    postsWithNonPKColumns: Post[]

    @ManyToMany((type) => Tag, (tag) => tag.categories)
    tags: Tag[]

    @ManyToMany((type) => Tag, (tag) => tag.categoriesWithOptions)
    tagsWithOptions: Tag[]

    @ManyToMany((type) => Tag, (tag) => tag.categoriesWithNonPKColumns)
    tagsWithNonPKColumns: Tag[]
}
