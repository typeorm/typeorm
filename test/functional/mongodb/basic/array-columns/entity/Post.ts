import { Entity } from "typeorm/decorator/entity/Entity"
import { Column } from "typeorm/decorator/columns/Column"
import { ObjectIdColumn } from "typeorm/decorator/columns/ObjectIdColumn"
import { Counters } from "./Counters"
import { ObjectID } from "typeorm/driver/mongodb/typings"

@Entity()
export class Post {
    @ObjectIdColumn()
    id: ObjectID

    @Column()
    title: string

    @Column((type) => Counters)
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
