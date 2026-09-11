import { ObjectId } from "mongodb"
import { Column, Entity, ObjectIdColumn } from "../../../../src"

@Entity()
export class Item {
    @ObjectIdColumn()
    public _id: ObjectId

    @Column()
    public contact?: string

    @Column({ array: true })
    public contacts: Array<string>

    @Column({ type: "json" })
    config: any
}
