import {
    Column,
    DeleteDateColumn,
    Entity,
    ObjectIdColumn,
} from "../../../../../../src"
import type { ObjectId } from "mongodb"

@Entity()
export class TransactionDocument {
    @ObjectIdColumn()
    id: ObjectId

    @Column()
    name: string

    @DeleteDateColumn()
    deletedAt?: Date
}
