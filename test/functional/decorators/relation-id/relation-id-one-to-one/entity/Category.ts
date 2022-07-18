import { Column } from "../typeorm/decorator/columns/Column"
import { PrimaryColumn } from "../typeorm/decorator/columns/PrimaryColumn"
import { Entity } from "../typeorm/decorator/entity/Entity"
import { OneToOne } from "../typeorm/decorator/relations/OneToOne"
import { RelationId } from "../typeorm/decorator/relations/RelationId"
import { Post } from "./Post"

@Entity()
export class Category {
    @PrimaryColumn()
    id: number

    @Column({ unique: true })
    name: string

    @OneToOne((type) => Post, (post) => post.category2)
    post: Post

    @RelationId((category: Category) => category.post)
    postId: number
}
