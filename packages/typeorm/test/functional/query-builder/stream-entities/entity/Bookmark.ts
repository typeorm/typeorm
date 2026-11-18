import { Entity } from "../../../../../src/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "../../../../../src/decorator/columns/PrimaryGeneratedColumn"
import { ManyToOne } from "../../../../../src/decorator/relations/ManyToOne"
import { RelationId } from "../../../../../src/decorator/relations/RelationId"
import { Post } from "./Post"

/**
 * Carries a @RelationId decorator, which streamEntities() rejects: those ids
 * are loaded by a second query that streaming cannot issue.
 */
@Entity()
export class Bookmark {
    @PrimaryGeneratedColumn()
    id: number

    @ManyToOne(() => Post)
    post: Post

    @RelationId((bookmark: Bookmark) => bookmark.post)
    postId: number
}
