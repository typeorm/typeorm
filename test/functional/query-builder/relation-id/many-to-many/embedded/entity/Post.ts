import { Entity } from "../../typeorm/decorator/entity/Entity"
import { Column } from "../../typeorm/decorator/columns/Column"
import { Counters } from "./Counters"

@Entity()
export class Post {
    @Column()
    title: string

    @Column(() => Counters, { prefix: "cnt" })
    counters: Counters
}
