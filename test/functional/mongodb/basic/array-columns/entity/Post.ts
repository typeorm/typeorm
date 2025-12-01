import { Entity } from "../../../../../../src/decorator/entity/Entity"
import { Column } from "../../../../../../src/decorator/columns/Column"
import { ObjectIdColumn } from "../../../../../../src/decorator/columns/ObjectIdColumn"
import { Counters } from "./Counters"
import { ObjectId } from "../../../../../../src/driver/mongodb/typings"

@Entity()
export class Post {
    @ObjectIdColumn()
    id: ObjectId

    @Column()
    title: string

    @Column(() => Counters)
    counters: Counters[]

    @Column()
    names: string[]

    @Column()
    numbers: number[]

    @Column()
    booleans: boolean[]

    @Column(() => Counters, { array: true })
    other1: Counters[]

    @Column(() => Counters, { array: true })
    other2: Counters[]
}
