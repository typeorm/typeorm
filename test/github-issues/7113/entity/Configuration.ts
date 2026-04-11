import { ObjectId } from "mongodb"
import { DeleteDateColumn, Entity, ObjectIdColumn } from "../../../../src"

@Entity()
export class Configuration {
    @ObjectIdColumn()
    _id: ObjectId

    @DeleteDateColumn()
    deletedAt?: Date
}
