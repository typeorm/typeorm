import { Entity } from "../../../../../../src/decorator/entity/Entity"
import { Counters } from "./Counters"
import { Column } from "../../../../../../src/decorator/columns/Column"
import { ObjectIdColumn } from "../../../../../../src/decorator/columns/ObjectIdColumn"
import { ObjectId } from "../../../../../../src/driver/mongodb/typings"

@Entity()
export class Post {
    @ObjectIdColumn()
    id: ObjectId

    @Column()
    title: string

    @Column()
    text: string

    @Column()
    index: number

    @Column(() => Counters)
    counters: Counters
}
