import { Entity } from "../../../../../../src/decorator/entity/Entity"
import { PrimaryColumn } from "../../../../../../src/decorator/columns/PrimaryColumn"
import { Column } from "../../../../../../src/decorator/columns/Column"
import { OneToOne } from "../../../../../../src/decorator/relations/OneToOne"
import { Post } from "./Post"
import { Tag } from "./Tag"
import { Unique } from "../../../../../../src"

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

    @OneToOne(() => Post, (post) => post.category)
    post: Post

    @OneToOne(() => Post, (post) => post.categoryWithOptions)
    postWithOptions: Post

    @OneToOne(() => Post, (post) => post.categoryWithNonPKColumns)
    postWithNonPKColumns: Post

    @OneToOne(() => Tag, (tag) => tag.category)
    tag: Tag

    @OneToOne(() => Tag, (tag) => tag.categoryWithOptions)
    tagWithOptions: Tag

    @OneToOne(() => Tag, (tag) => tag.categoryWithNonPKColumns)
    tagWithNonPKColumns: Tag
}
