import {
    DeleteDateColumn,
    Entity,
    ObjectID,
    ObjectIdColumn,
} from "../../../../src"

@Entity()
export class Configuration {
    @ObjectIdColumn()
    _id: ObjectID

    @DeleteDateColumn()
    deletedAt?: Date
}
