import { Entity } from "typeorm/decorator/entity/Entity"
import { Column } from "typeorm/decorator/columns/Column"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { Counters } from "./Counters"

@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string

    @Column()
    text: string

    @Column((type) => Counters)
    counters: Counters

    @Column((type) => Counters, { prefix: "testCounters" })
    otherCounters: Counters

    @Column((type) => Counters, { prefix: "" })
    countersWithoutPrefix: Counters
}
