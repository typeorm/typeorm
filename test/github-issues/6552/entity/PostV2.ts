import { ObjectID, ObjectIdColumn } from "../../../../src"
import { Column } from "../../../../src/decorator/columns/Column"
import { Entity } from "../../../../src/decorator/entity/Entity"

@Entity()
export class PostV2 {
    @ObjectIdColumn()
    postId: ObjectID

    @Column()
    title: string
}
