import { ObjectID, ObjectIdColumn } from "typeorm"
import { Column } from "typeorm/decorator/columns/Column"
import { Entity } from "typeorm/decorator/entity/Entity"

@Entity()
export class Post {
    @ObjectIdColumn()
    _id: ObjectID

    @Column()
    title: string
}
