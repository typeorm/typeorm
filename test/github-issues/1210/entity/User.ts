import { ObjectId } from "mongodb"
import { Column, Entity, ObjectIdColumn } from "../../../../src"
import { Event } from "./Event"

@Entity()
export class User {
    @ObjectIdColumn()
    id: ObjectId

    @Column()
    firstName: string

    @Column()
    lastName: string

    @Column()
    age: number

    @Column(() => Event)
    events: Event[]
}
