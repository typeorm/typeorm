import { ObjectId } from "mongodb"
import { Column, Entity, ObjectIdColumn } from "../../../../src"

@Entity()
export class Config {
    @ObjectIdColumn()
    _id: ObjectId

    @Column()
    itemId: string

    @Column({ type: "json" })
    data: any
}
