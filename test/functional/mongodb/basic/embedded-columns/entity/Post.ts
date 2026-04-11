import { ObjectId } from "mongodb"
import { Column, Entity, ObjectIdColumn } from "../../../../../../src"
import { Counters } from "./Counters"

@Entity()
export class Post {
    @ObjectIdColumn()
    id: ObjectId

    @Column()
    title: string

    @Column()
    text: string

    @Column(() => Counters)
    counters: Counters
}
