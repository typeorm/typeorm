import { ObjectId } from "mongodb"
import { Column, Entity, ObjectIdColumn } from "../../../../src"

@Entity()
export class User {
    @ObjectIdColumn()
    id: ObjectId

    @Column()
    name: string
}
