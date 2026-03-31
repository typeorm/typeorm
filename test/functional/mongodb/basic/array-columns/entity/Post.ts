import { ObjectId } from "mongodb"
import { Column, Entity, ObjectIdColumn } from "../../../../../../src"
import { Counters } from "./Counters"

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
