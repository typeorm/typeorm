import { ObjectID } from "../../../../src/driver/mongodb/typings"
import { Comment } from "./comment"
import { Column, Entity, ObjectIdColumn } from "../../../../src"

@Entity()
export class Post {
    @ObjectIdColumn()
    _id?: ObjectID

    @Column(() => Comment)
    comments: Comment[]
}
