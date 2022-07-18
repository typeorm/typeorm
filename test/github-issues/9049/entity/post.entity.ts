import { ObjectID } from "typeorm/driver/mongodb/typings"
import { Comment } from "./comment"
import { Column, Entity, ObjectIdColumn } from "typeorm"

@Entity()
export class Post {
    @ObjectIdColumn()
    _id?: ObjectID

    @Column(() => Comment)
    comments: Comment[]
}
