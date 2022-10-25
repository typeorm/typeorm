import { Entity } from "../../../../../../src/decorator/entity/Entity"
import { Column } from "../../../../../../src/decorator/columns/Column"
import { ObjectIdColumn } from "../../../../../../src/decorator/columns/ObjectIdColumn"
import { ObjectID } from "../../../../../../src/driver/mongodb/typings"
import { User } from "./User"

@Entity()
export class Post {
    @ObjectIdColumn()
    _id: ObjectID

    @Column()
    title: string

    /**
     ** @ObjectIdColumn({ name: "user" }) means it's an referenced ObjectId of "User" collection.
     */
    @ObjectIdColumn({ name: "user" })
    author: ObjectID | User
}
