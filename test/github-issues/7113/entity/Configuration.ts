import {
    DeleteDateColumn,
    Entity,
    ObjectId,
    ObjectIdColumn,
} from "../../../../src"

@Entity()
export class Configuration {
    @ObjectIdColumn()
    _id: ObjectId

    @DeleteDateColumn()
    deletedAt?: Date
}
