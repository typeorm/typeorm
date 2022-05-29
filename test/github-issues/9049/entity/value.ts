import { Column, ObjectID, ObjectIdColumn } from "../../../../src"

export class Value {
    @ObjectIdColumn()
    _id?: ObjectID

    @Column({ type: "string" })
    description: string
}
