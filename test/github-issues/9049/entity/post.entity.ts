import { ObjectID } from "../../../../src/driver/mongodb/typings"
import { Type } from "class-transformer"
import { Comment } from "./comment"
import { Column, Entity, ObjectIdColumn } from "../../../../src"

@Entity()
export class Post {
    @ObjectIdColumn()
    _id?: ObjectID

    @Type(() => Comment)
    @Column(() => Comment)
    comments: Comment[]
}
