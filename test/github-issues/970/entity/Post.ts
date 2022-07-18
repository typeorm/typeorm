import { Entity } from "typeorm/decorator/entity/Entity"
import { ObjectIdColumn } from "typeorm/decorator/columns/ObjectIdColumn"
import { ObjectID } from "typeorm/driver/mongodb/typings"
import { Column } from "typeorm/decorator/columns/Column"

@Entity()
export class Post {
    @ObjectIdColumn()
    id: ObjectID

    @Column()
    title: string

    @Column()
    text: string
}
