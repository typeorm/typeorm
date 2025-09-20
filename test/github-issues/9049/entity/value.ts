import { Column, ObjectId, ObjectIdColumn } from "../../../../src"

export class Value {
    @ObjectIdColumn()
    _id?: ObjectId

    @Column({ type: "string" })
    description: string
}
