import { DeleteDateColumn, Entity, ObjectID, ObjectIdColumn } from "typeorm"

@Entity()
export class Configuration {
    @ObjectIdColumn()
    _id: ObjectID

    @DeleteDateColumn()
    deletedAt?: Date
}
