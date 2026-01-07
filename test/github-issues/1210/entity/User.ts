import { Entity } from "../../../../src/decorator/entity/Entity"
import { ObjectIdColumn } from "../../../../src/decorator/columns/ObjectIdColumn"
import { Column } from "../../../../src/decorator/columns/Column"
import { ObjectId } from "../../../../src/driver/mongodb/typings"
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
