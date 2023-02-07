import { Entity } from "../../../../../../src/decorator/entity/Entity"
import { Counters } from "./Counters"
import { Column } from "../../../../../../src/decorator/columns/Column"
import { ObjectIdColumn } from "../../../../../../src/decorator/columns/ObjectIdColumn"
import { ObjectID } from "../../../../../../src/driver/mongodb/typings"

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
