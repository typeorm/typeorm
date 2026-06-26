import { Column } from "../../../../../../src/decorator/columns/Column"
import { ObjectIdColumn } from "../../../../../../src/decorator/columns/ObjectIdColumn"
import { ObjectId } from "../../../../../../src/driver/mongodb/typings"

export abstract class MongoBaseEntity {
    @ObjectIdColumn()
    _id: ObjectId

    @Column()
    description: string
}
