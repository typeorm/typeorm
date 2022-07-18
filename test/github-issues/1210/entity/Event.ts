import { ObjectID } from "typeorm/driver/mongodb/typings"
import { Entity } from "typeorm/decorator/entity/Entity"
import { ObjectIdColumn } from "typeorm/decorator/columns/ObjectIdColumn"
import { Column } from "typeorm/decorator/columns/Column"

@Entity()
export class Event {
    @ObjectIdColumn()
    id: ObjectID

    @Column()
    name: string

    @Column({ name: "at_date", default: Date.now })
    date: Date

    // @Column( type => User)
    // participants: User[]
}
