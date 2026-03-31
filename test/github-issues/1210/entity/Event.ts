import { ObjectId } from "mongodb"
import { Column, Entity, ObjectIdColumn } from "../../../../src"

@Entity()
export class Event {
    @ObjectIdColumn()
    id: ObjectId

    @Column()
    name: string

    @Column({ name: "at_date", default: Date.now })
    date: Date

    // @Column( type => User)
    // participants: User[]
}
