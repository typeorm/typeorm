import { Entity } from "typeorm/decorator/entity/Entity"
import { Column } from "typeorm/decorator/columns/Column"
import { ObjectIdColumn } from "typeorm/decorator/columns/ObjectIdColumn"
import { ObjectID } from "typeorm/driver/mongodb/typings"

@Entity()
export class Post {
    @ObjectIdColumn()
    nonIdNameOfObjectId: ObjectID

    @Column()
    title: string
}
