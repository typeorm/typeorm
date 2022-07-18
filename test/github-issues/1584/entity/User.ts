import { Entity } from "typeorm/decorator/entity/Entity"
import { ObjectIdColumn } from "typeorm/decorator/columns/ObjectIdColumn"
import { Column } from "typeorm/decorator/columns/Column"
import { ObjectID } from "typeorm/driver/mongodb/typings"

@Entity()
export class User {
    @ObjectIdColumn()
    id: ObjectID

    @Column()
    name: string
}
