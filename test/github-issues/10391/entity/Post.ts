import { Comment } from "./Comment"
import { Column, Entity, ObjectId, ObjectIdColumn } from "../../../../src"

@Entity()
export class Post {
    @ObjectIdColumn()
    _id?: ObjectId

    @Column(() => Comment)
    comments: Comment[]
}
