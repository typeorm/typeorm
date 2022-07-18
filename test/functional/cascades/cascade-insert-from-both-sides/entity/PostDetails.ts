import { Entity } from "typeorm/decorator/entity/Entity"
import { PrimaryColumn } from "typeorm/decorator/columns/PrimaryColumn"
import { Post } from "./Post"
import { OneToOne } from "typeorm/decorator/relations/OneToOne"

@Entity()
export class PostDetails {
    @PrimaryColumn()
    keyword: string

    @OneToOne((type) => Post, (post) => post.details, {
        cascade: ["insert"],
    })
    post: Post
}
