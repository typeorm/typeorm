import { Column, ObjectID, ObjectIdColumn } from "typeorm"

export class Value {
    @ObjectIdColumn()
    _id?: ObjectID

    @Column({ type: "string" })
    description: string
}
