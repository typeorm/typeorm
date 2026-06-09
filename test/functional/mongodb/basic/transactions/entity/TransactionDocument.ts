import { ObjectId } from "mongodb"
import { Column, Entity, ObjectIdColumn } from "../../../../../../src"

@Entity()
export class TransactionDocument {
    @ObjectIdColumn()
    id: ObjectId

    @Column()
    name: string
}
