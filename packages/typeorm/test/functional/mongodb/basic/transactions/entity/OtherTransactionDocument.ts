import { Column, Entity, ObjectIdColumn } from "../../../../../../src"
import type { ObjectId } from "mongodb"

@Entity()
export class OtherTransactionDocument {
    @ObjectIdColumn()
    id: ObjectId

    @Column()
    name: string
}
