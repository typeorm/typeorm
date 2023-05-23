import { Entity } from "../../../../src/decorator/entity/Entity"
import { ObjectIdColumn } from "../../../../src/decorator/columns/ObjectIdColumn"
import { Column } from "../../../../src/decorator/columns/Column"
import { ObjectId } from "../../../../src/driver/mongodb/typings"

@Entity()
export class User {
    @ObjectIdColumn()
    id: ObjectId

    @Column()
    name: string
}
