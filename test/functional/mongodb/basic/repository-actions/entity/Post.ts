import { Entity } from "typeorm/decorator/entity/Entity"
import { Counters } from "./Counters"
import { Column } from "typeorm/decorator/columns/Column"
import { ObjectIdColumn } from "typeorm/decorator/columns/ObjectIdColumn"
import { ObjectID } from "typeorm/driver/mongodb/typings"

@Entity()
export class Post {
    @ObjectIdColumn()
    id: ObjectID

    @Column()
    title: string

    @Column()
    text: string

    @Column()
    index: number

    @Column(() => Counters)
    counters: Counters
}
