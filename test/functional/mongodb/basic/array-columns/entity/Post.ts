import { Entity } from "../../../../../../src/decorator/entity/Entity"
import { Column } from "../../../../../../src/decorator/columns/Column"
import { ObjectIdColumn } from "../../../../../../src/decorator/columns/ObjectIdColumn"
import { Counters } from "./Counters"
import { ObjectID } from "../../../../../../src/driver/mongodb/typings"

@Entity()
export class Post {
    @ObjectIdColumn()
    id: ObjectID

    @Column()
    title: string

    @Column((type) => Counters, { array: true })
    counters: Counters[]

    @Column()
    names: string[]

    @Column()
    numbers: number[]

    @Column()
    booleans: boolean[]

    @Column((type) => Counters, { array: true })
    other1: Counters[]

    @Column((type) => Counters, { array: true })
    other2: Counters[]
}
