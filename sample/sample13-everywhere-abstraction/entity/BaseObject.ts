import { Column } from "../../../src/index"
import { BasePost } from "./BasePost"
import { PostAuthor } from "./PostAuthor"
import { ManyToOne } from "../../../src/decorator/relations/ManyToOne"
import { PrimaryColumn } from "../../../src/decorator/columns/PrimaryColumn"
import { Generated } from "../../../src/decorator/Generated"

export class BaseObject extends BasePost {
    @PrimaryColumn("double")
    @Generated()
    id: number

    @Column()
    title: string

    @ManyToOne((type) => PostAuthor, (post) => post.posts, {
        cascade: true,
    })
    author: PostAuthor
}
