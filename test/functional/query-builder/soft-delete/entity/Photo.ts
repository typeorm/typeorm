import { Entity } from "typeorm/decorator/entity/Entity"
import { DeleteDateColumn } from "typeorm/decorator/columns/DeleteDateColumn"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "typeorm/decorator/columns/Column"
import { Counters } from "./Counters"

@Entity()
export class Photo {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    url: string

    @Column((type) => Counters)
    counters: Counters

    @DeleteDateColumn()
    deletedAt: Date
}
