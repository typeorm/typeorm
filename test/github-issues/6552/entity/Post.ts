import { ObjectID, ObjectIdColumn } from "../../../../src"
import { Column } from "../../../../src/decorator/columns/Column"
import { Entity } from "../../../../src/decorator/entity/Entity"

@Entity()
export class Post {
    @ObjectIdColumn()
    _id: ObjectID

    @Column()
    title: string
}
