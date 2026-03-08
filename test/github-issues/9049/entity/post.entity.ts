import { Comment } from "./comment"
import { ObjectId } from "mongodb"
import { Column, Entity, ObjectIdColumn } from "../../../../src"

@Entity()
export class Post {
    @ObjectIdColumn()
    _id?: ObjectId

    @Column(() => Comment)
    comments: Comment[]
}
